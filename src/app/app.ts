import { Component } from '@angular/core';
import { ChangelogComponent } from './components/changelog/changelog.component';

@Component({
  imports: [ChangelogComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  template: '<app-changelog />',
})
export class App {}