import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { XmasLogo, XmasSanta } from 'ngx-xmas';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [XmasLogo, XmasSanta],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly santa = viewChild.required(XmasSanta);

  protected readonly december = new Date().getMonth() === 11;

  protected fly(): void {
    this.santa().fly();
  }
}
