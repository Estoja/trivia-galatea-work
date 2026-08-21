import { bootstrapApplication } from '@angular/platform-browser';
import { activeConfig } from './app/main.config';
import { App } from './app/app';

bootstrapApplication(App, activeConfig)
  .catch((err) => console.error(err));
