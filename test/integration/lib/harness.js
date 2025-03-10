const fs = require('fs');
const path = require('path');
const queue = require('d3-queue').queue;
const colors = require('chalk');
const template = require('lodash.template');
const shuffler = require('shuffle-seed');

module.exports = async function (directory, implementation, options, run) {
  const q = queue(1);
  const loader = require('./loader')();

  const tests = options.tests || [];
  const ignores = options.ignores || {};

  let sequence = (
    await Promise.all(
      fs.globSync(`**/${options.fixtureFilename || 'style.json'}`, { cwd: directory }).map(async fixture => {
        const id = path.dirname(fixture);
        const style = require(path.join(directory, fixture));

        await loader.localizeURLs(style);

        style.metadata = style.metadata || {};
        const test = (style.metadata.test = Object.assign(
          {
            id,
            ignored: ignores[`${path.basename(directory)}/${id}`],
            width: 512,
            height: 512,
            pixelRatio: 1,
            recycleMap: options.recycleMap || false,
            allowed: 0.00015
          },
          style.metadata.test
        ));

        if ('diff' in test) {
          if (typeof test.diff === 'number') {
            test.allowed = test.diff;
          } else if (implementation in test.diff) {
            test.allowed = test.diff[implementation];
          }
        }

        return style;
      })
    )
  ).filter(style => {
    const test = style.metadata.test;

    if (tests.length !== 0 && !tests.some(t => test.id.indexOf(t) !== -1)) {
      return false;
    }

    if (implementation === 'native' && process.env.BUILDTYPE !== 'Debug' && test.id.match(/^debug\//)) {
      console.log(colors.gray(`* skipped ${test.id}`));
      return false;
    }

    if (/^skip/.test(test.ignored)) {
      console.log(colors.gray(`* skipped ${test.id} (${test.ignored})`));
      return false;
    }

    return true;
  });

  if (options.shuffle) {
    console.log(colors.white('* shuffle seed: ') + colors.bold(`${options.seed}`));
    sequence = shuffler.shuffle(sequence, options.seed);
  }

  sequence.forEach(style => {
    q.defer(callback => {
      const test = style.metadata.test;

      try {
        console.log(colors.blue(`* testing ${test.id}`));
        run(style, test, handleResult);
      } catch (error) {
        handleResult(error);
      }

      function handleResult(error) {
        if (error) {
          test.error = error;
        }

        if (test.ignored && !test.ok) {
          test.color = '#9E9E9E';
          test.status = 'ignored failed';
          console.log(colors.white(`* ignore ${test.id} (${test.ignored})`));
        } else if (test.ignored) {
          test.color = '#E8A408';
          test.status = 'ignored passed';
          console.log(colors.yellow(`* ignore ${test.id} (${test.ignored})`));
        } else if (test.error) {
          test.color = 'red';
          test.status = 'errored';
          console.log(colors.red(`* errored ${test.id}`));
        } else if (!test.ok) {
          test.color = 'red';
          test.status = 'failed';
          console.log(colors.red(`* failed ${test.id}`));
        } else {
          test.color = 'green';
          test.status = 'passed';
          console.log(colors.green(`* passed ${test.id}`));
        }

        callback(null, test);
      }
    });
  });

  q.awaitAll((err, results) => {
    if (err) {
      console.error(err);
      setTimeout(() => {
        process.exit(-1);
      }, 0);
      return;
    }

    const tests = results.slice(1, -1);

    if (process.env.UPDATE) {
      console.log(`Updated ${tests.length} tests.`);
      process.exit(0);
    }

    let passedCount = 0;
    let ignoreCount = 0;
    let ignorePassCount = 0;
    let failedCount = 0;
    let erroredCount = 0;

    tests.forEach(test => {
      if (test.ignored && !test.ok) {
        ignoreCount++;
      } else if (test.ignored) {
        ignorePassCount++;
      } else if (test.error) {
        erroredCount++;
      } else if (!test.ok) {
        failedCount++;
      } else {
        passedCount++;
      }
    });

    const totalCount = passedCount + ignorePassCount + ignoreCount + failedCount + erroredCount;

    if (passedCount > 0) {
      console.log(colors.green('%d passed (%s%)'), passedCount, ((100 * passedCount) / totalCount).toFixed(1));
    }

    if (ignorePassCount > 0) {
      console.log(
        colors.yellow('%d passed but were ignored (%s%)'),
        ignorePassCount,
        ((100 * ignorePassCount) / totalCount).toFixed(1)
      );
    }

    if (ignoreCount > 0) {
      console.log(colors.white('%d ignored (%s%)'), ignoreCount, ((100 * ignoreCount) / totalCount).toFixed(1));
    }

    if (failedCount > 0) {
      console.log(colors.red('%d failed (%s%)'), failedCount, ((100 * failedCount) / totalCount).toFixed(1));
    }

    if (erroredCount > 0) {
      console.log(colors.red('%d errored (%s%)'), erroredCount, ((100 * erroredCount) / totalCount).toFixed(1));
    }

    const resultsTemplate = template(fs.readFileSync(path.join(__dirname, '..', 'results.html.tmpl'), 'utf8'));
    const itemTemplate = template(fs.readFileSync(path.join(directory, 'result_item.html.tmpl'), 'utf8'));

    const unsuccessful = tests.filter(test => test.status === 'failed' || test.status === 'errored');

    const resultsShell = resultsTemplate({
      unsuccessful,
      tests,
      shuffle: options.shuffle,
      seed: options.seed
    }).split('<!-- results go here -->');

    const p = path.join(directory, options.recycleMap ? 'index-recycle-map.html' : 'index.html');
    const out = fs.createWriteStream(p);

    const q = queue(1);
    q.defer(write, out, resultsShell[0]);
    for (const test of tests) {
      q.defer(write, out, itemTemplate({ r: test, hasFailedTests: unsuccessful.length > 0 }));
    }
    q.defer(write, out, resultsShell[1]);
    q.await(() => {
      out.end();
      out.on('close', () => {
        console.log(`Results at: ${p}`);
        process.exit(failedCount + erroredCount === 0 ? 0 : 1);
      });
    });
  });
};

function write(stream, data, cb) {
  if (!stream.write(data)) {
    stream.once('drain', cb);
  } else {
    process.nextTick(cb);
  }
}
