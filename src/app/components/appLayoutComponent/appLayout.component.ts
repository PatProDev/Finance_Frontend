import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideBarComponent } from '../../components/sideBar/sideBar.component';

@Component({
  selector: 'app-app-layout-component',
  imports: [RouterOutlet, SideBarComponent],
  templateUrl: './appLayout.component.html',
  styleUrl: './appLayout.component.css'
})
export class AppLayoutComponent {}
