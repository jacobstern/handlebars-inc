import {createFrame, isArray, isFunction} from '../vendor/handlebars/utils';
import Exception from '../vendor/handlebars/exception';

export default function(instance) {
  instance.registerHelper('each', function(context, options) {
    if (!options) {
      throw new Exception('Must pass iterator to #each');
    }

    let fn = options.fn,
        inverse = options.inverse,
        i = 0,
        data;

    if (isFunction(context)) { context = context.call(this); }

    if (options.data) {
      data = createFrame(options.data);
    }

    function execIteration(field, index, last) {
      if (data) {
        data.key = field;
        data.index = index;
        data.first = index === 0;
        data.last = !!last;
      }

      let thunk = fn(context[field], {
        data: data,
        blockParams: [context[field], field]
      });

      thunk();
    }

    return () => {
      if (context && typeof context === 'object') {
        if (isArray(context)) {
          for (let j = context.length; i < j; i++) {
            if (i in context) {
              execIteration(i, i, i === context.length - 1);
            }
          }
        } else {
          let priorKey;
  
          for (let key in context) {
            if (context.hasOwnProperty(key)) {
              // We're running the iterations one step out of sync so we can detect
              // the last iteration without have to scan the object twice and create
              // an itermediate keys array.
              if (priorKey !== undefined) {
                execIteration(priorKey, i - 1);
              }
              priorKey = key;
              i++;
            }
          }
          if (priorKey !== undefined) {
            execIteration(priorKey, i - 1, true);
          }
        }

        if (i === 0) {
          let inversed = inverse(this);
          if (typeof inversed === 'function') {
            inversed();
          } 
        }
      }
    };
  });
}
