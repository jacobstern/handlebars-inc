import {createFrame, isArray, isFunction} from '../../lib/vendor/handlebars/utils';
import Exception from '../../lib/vendor/handlebars/exception';

export default function(instance) {
  instance.registerHelper('each', function(context, options) {
    if (!options) {
      throw new Exception('Must pass iterator to #each');
    }

    let idom = options.idom,
        fn = options.fn,
        inverse = options.inverse,
        i = 0,
        buffer = '',
        idomThunks = [],
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

      let res = fn(context[field], {
        data: data,
        blockParams: [context[field], field]
      });

      if (idom && typeof res === 'function') {
        idomThunks.push(res);
      } else {
        buffer = buffer + res;
      }
    }

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
    }

    let ret;
  
    if (i === 0) {
      ret = inverse(this);
    }

    if (idom) {
      ret = () => {
        idomThunks.forEach(thunk => {
          thunk();
        });
      };
    } else {
      ret = buffer;
    }

    return ret;
  });
}
