# @vodacom/web-config

> Config fetching for web

[![NPM](https://img.shields.io/npm/v/vod-npm-web-config.svg)](https://www.npmjs.com/package/vod-npm-web-config) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save @vodacom/web-config
```

## Usage

```jsx
import {
  Config
} from '@vodacom/web-config';

Config
  .init(
    'https://url.to/your/config/json/object',
    false,
    {
      default: 'config',
      can: 'be specified as a fallback'
    }
  )
  .catch(e => explode(e));
  
let val = await Config.get('key');

```
