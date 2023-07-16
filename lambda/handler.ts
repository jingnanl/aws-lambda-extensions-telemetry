import { Context } from 'aws-lambda';

export async function handler(event: any, context: Context) {
  console.log(event);
  console.log(context);

  for(let i = 0; i < 100; i++) {
    if (i % 2 === 0) {
      console.warn("warn log: " + i);
    } else {
      console.error("error log: " + i);
    }
  }
}
