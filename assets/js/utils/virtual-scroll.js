// assets/js/utils/virtual-scroll.js — Virtual scrolling para tablas grandes
export class VirtualScroller {
  constructor(config = {}) {
    this.container = config.container;
    this.items = config.items || [];
    this.itemHeight = config.itemHeight || 50;
    this.renderItem = config.renderItem || ((item) => `<div>${item}</div>`);
    this.bufferSize = config.bufferSize || 5;
    this.maxHeight = config.maxHeight || '500px';

    this.scrollTop = 0;
    this.visibleStart = 0;
    this.visibleEnd = 0;

    this.init();
  }

  init() {
    if (!this.container) return;

    this.viewport = document.createElement('div');
    this.viewport.style.cssText = `
      height: ${this.maxHeight};
      overflow-y: auto;
      position: relative;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
    `;

    this.content = document.createElement('div');
    this.content.style.cssText = `
      position: relative;
      height: ${this.items.length * this.itemHeight}px;
    `;

    this.viewport.appendChild(this.content);
    this.container.appendChild(this.viewport);

    this.viewport.addEventListener('scroll', () => this.render());
    this.render();
  }

  render() {
    this.scrollTop = this.viewport.scrollTop;
    this.visibleStart = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.bufferSize);
    this.visibleEnd = Math.min(
      this.items.length,
      Math.ceil((this.scrollTop + this.viewport.clientHeight) / this.itemHeight) + this.bufferSize
    );

    this.content.innerHTML = '';

    for (let i = this.visibleStart; i < this.visibleEnd; i++) {
      const item = document.createElement('div');
      item.style.cssText = `
        position: absolute;
        top: ${i * this.itemHeight}px;
        height: ${this.itemHeight}px;
        width: 100%;
      `;
      item.innerHTML = this.renderItem(this.items[i], i);
      this.content.appendChild(item);
    }
  }

  updateItems(newItems) {
    this.items = newItems;
    this.content.style.height = `${this.items.length * this.itemHeight}px`;
    this.render();
  }

  destroy() {
    if (this.viewport) {
      this.viewport.removeEventListener('scroll', () => this.render());
      this.viewport.remove();
    }
  }
}
