import registerEach from './each';
import registerLog from '../vendor/handlebars/helpers/log';

export function registerHelperOverrides(env) {
  registerEach(env);
  // Log helper references the instance directly so we have to register it again
  registerLog(env);
}
