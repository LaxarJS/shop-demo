This directory allows to use [magellan](https://github.com/TestArmada/magellan) to run [nightwatch](http://nightwatchjs.org/) tests on [Sauce Labs](https://saucelabs.com/).

Set the Sauce Labs environment variables `SAUCE_USERNAME` and `SAUCE_ACCESS_KEY` and run the tests with:

```console
npm install
npm test
```

after having started the shop demo.

Note that all tests require the optimized shop-demo version.
Call ``npm run dist`` once in the base directory, if you haven't already.

Alternatively run the `runtests` script, which is used by Travis-CI to execute the tests.
It takes care of everything, including starting the shop-demo.
