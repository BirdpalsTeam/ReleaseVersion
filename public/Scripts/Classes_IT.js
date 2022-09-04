class Item extends PIXI.Sprite{
	constructor(item, frame){
		super(resources.items.textures[`${item}_4.png`]);
		this.anchor.set(0.5, -0.5);
		this.item = item;
		this.frame = frame;
		this.itemData = resources.items.data;
		this.y = this.itemData.frames[`${item}_${frame}.png`].position.y;
		this.x = this.itemData.frames[`${item}_${frame}.png`].position.x;
	}

	updateFrame(frame){
		this.texture = resources.items.textures[`${this.item}_${frame}.png`];
		this.y = this.itemData.frames[`${this.item}_${frame}.png`].position.y;
		this.x = this.itemData.frames[`${this.item}_${frame}.png`].position.x;

		this.frame = frame; //For debugging
	}
}