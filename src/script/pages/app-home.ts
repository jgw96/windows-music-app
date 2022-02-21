import { LitElement, css, html } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';

// For more info on the @pwabuilder/pwainstall component click here https://github.com/pwa-builder/pwa-install
import '@pwabuilder/pwainstall';
import { loadMusic } from '../services/load-music';

import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0-beta.69/dist/components/button/button.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0-beta.69/dist/components/card/card.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0-beta.69/dist/components/animation/animation.js';
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.0.0-beta.69/dist/components/icon/icon.js';

@customElement('app-home')
export class AppHome extends LitElement {
  // For more information on using properties and state in lit
  // check out this link https://lit.dev/docs/components/properties/
  @property() message = 'Welcome!';

  // vars for music lib
  @state() music: any[] | undefined = undefined;
  @state() currentEntry: any = undefined;

  @state() playing: boolean = false;

  analyser: any;
  source: any;
  audioContext: any;
  canvas: any;

  static get styles() {
    return css`
      #musicControls {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 1em;
        display: flex;

            /* height: 2em; */
        justify-content: space-around;
        flex-direction: column;
        align-items: center;
        backdrop-filter: blur(14px);
      }

      #controlBar {
        display: flex;
        position: fixed;
        top: 12px;
        right: 0;
        padding-right: 12px;
      }

      #center {
        display: grid;
        grid-template-columns: 24vw 76vw;
      }

      #center ul {
        list-style: none;
        padding: 0;
        margin: 0;

        height: 83vh;
        overflow-y: scroll;
        overflow-x: hidden;
      }

      #center ul::-webkit-scrollbar {
        width: 8px;               /* width of the entire scrollbar */
      }

      #center ul sl-card {
        margin-bottom: 10px;
        cursor: pointer;
        width: 100%;
      }

      #preview {
        height: 50vh;
        width: 100vw;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      canvas {
        height: 100%;
        width: 100%;
        border-radius: 8px;
      }

      #musicControls span {
        font-weight: bold;

        display: block;
        margin-bottom: 9px;
      }

      #visuals img {
        height: 52%;
        width: 100%;
      }

      #musicControls sl-button sl-icon {
        margin-top: 7px;
        margin-left: 4px;
        height: 1em;
        font-size: 2em;
      }

      @media(prefers-color-scheme: light) {
        #musicControls span {
          color: black;
        }
      }

      @media(horizontal-viewport-segments: 2) {
        #center {
          grid-template-columns: 50vw 50vw;
        }

        #musicList {
          padding-right: 2.4em;
        }

        #preview {
          width: 48vw;
          position: fixed;
        }

        #musicControls {
          justify-content: space-between;
          flex-direction: row;
        }

        #musicControls span {
          max-width: 30em;
        }
      }

      @media(max-width: 716px) {
        #center {
          grid-template-rows: 20vh 80vh;
          grid-template-columns: auto;
        }

        #musicList {
          overflow: hidden;
          grid-row: 2;

          z-index: 1;
        }

        #center ul {
          height: 60vh;
        }

        #visuals img {
          height: 120%;
        }

        #preview {
          position: fixed;
          top: 6em;
          left: 0em;
        }

        #musicControls {
          z-index: 2;
        }

        #musicControls span {
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
          display: block;
          width: 70vw;
          /* text-align: center; */
        }

        #textDiv {
              /* text-align: center; */
          display: flex;
          text-align: center;
          justify-content: center;
        }
      }
    `;
  }

  constructor() {
    super();
  }

  async firstUpdated() {
    // this method is a lifecycle even in lit
    // for more info check out the lit docs https://lit.dev/docs/components/lifecycle/
    console.log('This is your home page');

    const audio = this.shadowRoot?.querySelector("audio");
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    if (audio) {
      this.source = this.audioContext.createMediaElementSource(audio);
      this.analyser = this.audioContext.createAnalyser();
    }

    if ('OffscreenCanvas' in window) {
      // @ts-ignore
      this.canvas = new OffscreenCanvas(window.innerWidth, window.innerHeight);
    }
    else {
      this.canvas = document.createElement('canvas');
    }

  }

  share() {
    if ((navigator as any).share) {
      (navigator as any).share({
        title: 'PWABuilder pwa-starter',
        text: 'Check out the PWABuilder pwa-starter!',
        url: 'https://github.com/pwa-builder/pwa-starter',
      });
    }
  }

  async load() {
    const music = await loadMusic();
    console.log(music);

    let entryArray = [];

    for await (const entry of music.values()) {
      entryArray.push(entry);
    }

    if (entryArray && entryArray.length > 0) {
      this.music = entryArray;
    }

    this.setupListeners();
  }

  async loadSong(entry: any) {
    console.log(entry);
    const fileData = await entry.getFile();
    this.currentEntry = fileData;

    console.log("fileData", fileData);

    const audio = this.shadowRoot?.querySelector("audio");

    if (audio) {
      audio.src = URL.createObjectURL(fileData);
      await this.play();
    }
  }

  setupListeners() {
    // play next track when current track ends
    const audio = this.shadowRoot?.querySelector("audio");

    if (audio) {
      audio.onended = () => {
        this.playNext();
      };
    }
  }

  playNext() {
    if (this.music && this.music.length > 0) {
      const index = this.music.findIndex(entry => entry === this.currentEntry);
      const nextIndex = index + 1;

      if (nextIndex < this.music.length) {
        this.loadSong(this.music[nextIndex]);
      }
    }
  }

  async play() {
    this.playing = true;

    const audio = this.shadowRoot?.querySelector("audio");

    if (audio) {
      console.log('audio', audio);
      await audio.play();



      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      this.analyser.fftSize = 2048;
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      this.runVisual(dataArray);
    }
  }

  runVisual(data: Uint8Array) {
    let onscreenCanvas = null;

    if ('OffscreenCanvas' in window) {
      onscreenCanvas = this.shadowRoot?.querySelector('canvas')?.getContext('bitmaprenderer');
    }
    else {
      onscreenCanvas = this.shadowRoot?.querySelector('canvas');
    }

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    const context = this.canvas.getContext('2d');

    context?.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.draw(data, context, this.canvas, onscreenCanvas);
  }

  // @ts-ignore
  draw(data: Uint8Array, context: any, canvas: HTMLCanvasElement | OffscreenCanvas, onScreenCanvas: ImageBitmapRenderingContext | HTMLCanvasElement | null | undefined) {
    this.analyser?.getByteFrequencyData(data);

    context.fillStyle = window.matchMedia('(prefers-color-scheme: dark)').matches ? '#181818' : '#edebe9';
    context.fillRect(0, 0, window.innerWidth, window.innerHeight);

    let barWidth = (window.innerWidth / data.length) * 4.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      barHeight = data[i];

      context.fillStyle = 'rgb(' + (barHeight + 100) + ',107,210)';
      context.fillRect(x, window.innerHeight - barHeight * 4, barWidth, barHeight * 4);

      x += barWidth + 1;
    }

    if ('OffscreenCanvas' in window) {
      // @ts-ignore
      let bitmapOne = (canvas as OffscreenCanvas).transferToImageBitmap();
      (onScreenCanvas as ImageBitmapRenderingContext).transferFromImageBitmap(bitmapOne);
    }

    window.requestAnimationFrame(() => this.draw(data, context, canvas, onScreenCanvas));
  }

  pause() {
    const audio = this.shadowRoot?.querySelector("audio");

    if (audio) {
      audio.pause();
    }

    this.playing = false;
  }

  render() {
    return html`
      <app-header></app-header>

      <div>
        <div id="controlBar">
          ${this.music && this.music.length > 0 ? html`<sl-button variant="primary" @click="${() => this.load()}">Load Music
          </sl-button>` : null}
        </div>

        <div id="center">
          <section id="musicList">
            ${this.music && this.music.length > 0 ? html`
            <sl-animation name="fadeInLeft" easing="ease-in-out" duration="400" iterations="1" play>
              <ul>
                ${this.music.map(entry => html`
                <sl-card aria-role="button" @click="${() => this.loadSong(entry)}" class="card-footer">
                  ${entry.name}
                </sl-card>
                `)}
              </ul>
            </sl-animation>
            ` : html`<div id="preview">
              <sl-button variant="primary" @click="${() => this.load()}">Load Music</sl-button>
            </div>`}
          </section>

          <section id="visuals">
            ${this.playing === false ? html`<sl-animation name="fadeIn" easing="ease-in-out" duration="800" iterations="1" play><img
                src="/assets/playing-graphic.svg"></sl-animation>` : null}
            <canvas></canvas>
          </section>
        </div>

        <sl-animation name="slideInUp" easing="ease-in-out" duration="400" iterations="1" play>
          <div id="musicControls">
            <div id="textDiv">
              <span>${this.currentEntry?.name || "No music playing"}</span>
            </div>

            <audio autoplay></audio>

            ${this.music && this.music.length > 0 ? html`<div>
              ${this.playing === false ? html`<sl-button variant="success" @click="${() => this.play()}">Play</sl-button>` :
              html`<sl-button variant="danger" @click="${() => this.pause()}">Pause</sl-button>`}
            </div>` : null}
          </div>
        </sl-animation>
      </div>
    `;
  }
}
