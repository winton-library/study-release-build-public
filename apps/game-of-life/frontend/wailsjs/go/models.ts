export namespace main {
	
	export class GameState {
	    grid: boolean[][];
	    generation: number;
	    playing: boolean;
	
	    static createFrom(source: any = {}) {
	        return new GameState(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.grid = source["grid"];
	        this.generation = source["generation"];
	        this.playing = source["playing"];
	    }
	}

}

