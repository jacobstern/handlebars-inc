import HandlebarsInc from '../lib';
import { readExamplesFile } from './test-helpers';

test('logs to the console when the log helper is used', async () => {
  const hbs = await readExamplesFile('hbs/log.hbs');
  const template = HandlebarsInc.compile(hbs);
  const restoreLog = HandlebarsInc.log;
  HandlebarsInc.log = jest.fn();
  expect(template()).toBe('');
  expect(HandlebarsInc.log).toBeCalledWith(1, 'Look at me!');
  HandlebarsInc.log = restoreLog;
});
