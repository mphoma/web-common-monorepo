# @vodacom/web-state

> Data storage for web

[![NPM](https://img.shields.io/npm/v/vod-npm-web-state.svg)](https://www.npmjs.com/package/vod-npm-web-state) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save @vodacom/web-state
```

## Usage

```jsx
import React, { Component } from 'react'
import State from '@vodacom/web-state'

// Sets global default request headers that will be sent on all requests made regardless of state context
State.setDefaultHeaders({
  'x-api-channel': 'BestChannel'
});

let myState = State.with('myComponent', 'optionalBasePath');

myState.set(
  'myKey',
  {
    super: 'Important',
    data: 'That makes this module awesome!'
  },
  true,
  false
);

let myData = myState.get(
  'myKey',
  {
    super: 'Cool that it supports',
    data: 'Fallback when the value for that key does not exists'
  },
  false
);

let res = myState.fetch(
  './some/remote/endpoint/with/:path/:parameters',
  {
    method: 'GET',
    queryParameters: {
      cool: 'query parameters'
    },
    pathParameters: {
      path: 'parameterSupportIsSweet',
      parameters: 'forAllSituations'
    },
    headers: {
      need: 'a header? We have you covered'
    },
    body: {
      let: {
        your: 'backend know you care!'
      }
    },
    strategy: CacheStrategy.CacheFirst,
    callback: (res) => {handleTheNewData(res)}
  }
);
```

## License

- © Copyright Vodacom 2019
