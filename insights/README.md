@vodacom/web-events
Vodacom Insights package for React web projects

Installation
npm install @vodacom/web-insights
Usage
There are many insights that will automatically trigger such as button clicks and page views. So for the most part you won't have to do more than initialize Insights in your project.

Initialization
To initialize Insights, simply import and call init.

The first parameter takes an object of options.

option	description
contextProvider	A function that returns an object containing your apps context
providers	An object containing all the providers you want insights to report to. The key is a name and the value is the provider instance, object or function
import {
  Insights
} from '@vodacom/web-insights';

const tealium = Tealium.with({});
Sentry.init({});

Insights.init({
  providers: {
    sentry: Sentry,
    tealium: tealium,
  },
});
Context
Sometimes you want insights to be aware of additional data such as Journey name and scene name.

There are four ways to achieve this. You can either give it your apps context; add context globally to the Insights object; to a specific instance or to a function call on the instance.

App Context
Insights expects a function to be passed to contextProvider option when you call init(). When insights injects your context into the data object passed to the providers. It will call this function and add it to the appContext key on the data object.

If you have a key called appContext in either global context or instance context, it will be overridden. Only the function calls context will override the appContext key.

Global Context
// The following methods are synonymous.
Insights.init({
  context: {
    version: APP_VERSION,
  },
});

Insights.setContext({
  version: APP_VERSION,
});
Instance Context
Will merge with and override global context.

const insights = Insights.with({
  journey: 'upgrade',
});
Function Calls
Will merge with and override instance context.

The following functions can be called on the instance with a data object. They will trigger their respective Insights events.

tag - Insight.Tag
info - Insight.Info
warn - Insight.Warn
debug - Insight.Debug
error - Insight.Error
You can also call send(insightEvent, dataObject) if you want to specify an event that is not covered by the above functions.

// These two lines are synonymous
insights.info(data);
insights.send(Insight.Info, data);
Note that the context you gave globally or to the instance will be merged with the additional data passed to the insight event, prioritizing the passed object.

Example

// Set the instance context so that journey and scene are always passed along.
const insights = Insights.with({
  journey: 'upgrade',
  scene: 'dealsGrid',
});

// Send the below context to the providers
// {
//   journey: 'upgrade',
//   scene: 'dealsGrid',
// }
// 
insights.info();

// Send the below context to the providers
// {
//   journey: 'simswap', <-- Note that we have merged the objects, overriding with the key passed to the info call.
//   scene: 'dealsGrid',
// }
// 
insights.info({
  journey: 'simswap',
});
Adding/Removing providers
You can add or remove providers dynamically by call the addProvider and removeProvider functions.

Insights.addProvider('sentry', Sentry);
Insights.removeProvider('sentry');