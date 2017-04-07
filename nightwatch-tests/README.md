This directory demonstrates how to use magellan to run nightwatch-tests on saucelabs. Set the sauce lab environment variables SAUCE_USERNAME and SAUCE_ACCESS_KEY and run the tests with 
```npm test``` 
after having started the shop demo.

Note that all tests require the optimized shop-demo version. Call ``npm run dist`` once in the base directory, if you haven't already.

Alternatively run the `runtests` script, which is used by travis to execute the tests.
It takes care of everything, including starting the shop-demo.
