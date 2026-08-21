import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'tg-welcome-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>welcome works</p>`,
})
export class WelcomePage {}
