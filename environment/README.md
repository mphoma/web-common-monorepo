# @vodacom/web-env

API for handling different environments.

## Initialisation
```js
import {
  Environment
} from '@vodacom/web-env';

//Bare minimum setup, using only one environment.
Environment.init({
  Local: {
    uiHost: 'http://localhost:3000',
    apiHost: 'https://myvodacomuat.secure.vodacom.co.za',
    //Any other keys you wish to have.
  }
});
```

### Environment config variables

The first parameter is an object of environment configs.

Any key can be given to the environment config. This allows you to be able to configure any value to change on a per environment basis. A few built in keys are provided for ease of use. All keys marked in bold are required.

#### Built in
|key|description|defaults
|---|---|---|
|**uiHost**|The host that the UI will be served on, including protocol.|**N/A (required)**|
|**apiHost**|The host that the API requests will be made to, including protocol.|**N/A (required)**|
|uiBase|The relative base that the UI is served from.|/|
|apiBase|The relative base that the API is served from.|/|
|assetBase|The relative base that the Assets are served from.|/|
|uiPath|The full path (host+base) for the UI.|Will always be host+base|
|apiPath|The full path for the API.|Will always be host+base|
|assetPath|The full path for the asset.|Will always be host+base|
|name|Human readable name for the environment.| Environment key|
|navigatorType|The type of [react router](https://reacttraining.com/react-router/core/api/Router) to use.|`browser` in local, `memory` everywhere else.|

### Options

The second parameter is an object of options.

|key|description|defaults
|---|---|---|
autodetect|Whether the current environment should be automatically detected or not.|true|

## Usage
After initialising your environments, the currently selected environment can be used via the `Environment.current` property.

### Examples
```js
let res = await SomeProvider.state.fetch(
  `${Environment.current.apiHost}/some/url/to/call`,
  {
    //...
  }
);

const mySpecialValue = Environment.current.someCustomKey;
```

If autodection was turned off, you can manually set the current environment by doing the following:

```js
Environment.set('environmentKey');
```