import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalMessageComponent } from './components/globalMessage/globalMessage.component';

@Component({
  selector: 'app-root',
  imports: [GlobalMessageComponent, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
}
