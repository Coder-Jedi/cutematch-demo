import { Component, Input, OnInit } from '@angular/core';
import Phaser from 'phaser';
import { MainScene } from './scenes/main-scene';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  @Input() height! : number;
  @Input() width! : number;

  phaserGame!: Phaser.Game;
  config: Phaser.Types.Core.GameConfig;

  constructor() {
    this.height = window.innerHeight;
    this.width = window.innerWidth;
    this.config = {
      type: Phaser.AUTO,
      height: this.height,
      width: this.width,
      scene: [ MainScene ],
      parent: 'gameContainer',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 100 }
        }
      }
    };
   }

  ngOnInit(): void {
    this.phaserGame = new Phaser.Game(this.config);
  }

}
