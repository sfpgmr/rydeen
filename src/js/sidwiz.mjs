
/**
 * original:
 * https://github.com/Chordian/deepsid/blob/master/js/scope.js
 */

/**
* Code losely based on C# implementation of SidWiz2 by RushJet1 & Rolf R Bakke (see respective Form1.cs).
*
* note: original implementation included logic for multi-voice/-column layout whereas this implementation
* renders exactely one voice and always uses 1 column. Instead of rendering a
* complete sample file this implementation only renders the frame corresponding to the currently played music.
*
* note: the maximum "scale" that can be used is limited by the size of the sample data array passed to "draw()".
* In order to use the maximum scale make sure the player delivers 16k of sample data..
* 
* note: original implementation used 0-255 integer range sample data - while a -1 to 1 float range is used here.
*/

export default class SidWiz {
  constructor (width, height, altsync) {
    // graphics context to draw in:
    this._resX = width;
    this._resY = height;
    
    this._voiceData= null;	// new data is fed in for each frame
    
    this._altSync= altsync;	// enable "alt sync" impl for the voice
  
    this._scales = [0.125, 0.25, 0.5, 1, 2, 4,   8,   16  ];
    this._centers= [32,    16,   8,   4, 2, 1,   0.5, 0.25];
    this.sampleRate = 96000;
  }

  setHeight(height) {
		this._resY= height;
  }
  		
	getTriggerLevel(jua, jac, offset) {
		// scan for peak values
		let yMax= -1;    	// was 0
		let yMin= 1;		// was 255
		const juaHalf= Math.floor(jua/2);
		const s = juaHalf-jac;
		for (var h = s; h <= (juaHalf+jac); h++) {	// uses 2 center frames.. ?
			var value = this._voiceData[offset+h];
			if (value > yMax) { yMax = value; }
			if (value < yMin) { yMin = value; }
		}
		return ((yMin + yMax) / 2);   //the middle line of the waveform
	}
	/**
	* Gets the number of coordinates that will be output by draw().
	*/
	getNumberOfOuptutCoords(scaleIdx) {
		return this._resX*(this._scales[scaleIdx] / 2);	
	}
	/**
	* @param outCtx canvas context directly used for line drawing (if outVertices param is NOT supplied)
	* @param outVertices if optional Float32Array (which must be big enough) is supplied then result line is not drawn to 
	*                     canvas but instead coordinates are stored as 3d coordinates (z=0) in that array. The size requirement
	*                     can be calculated via getNumberOfOuptutCoords()
	*/

  draw(data, scaleIdx, outCtx, outVertices) {
    const sampleRate = this.sampleRate
    
		this._voiceData= data;
	
		const scale= this._scales[scaleIdx];
		const center= this._centers[scaleIdx];

		// note: the crappy variable naming of the original implementation has been
		// largely preserved to ease comparisons..
		
		const jumpAmount = (sampleRate / 60);         	// samples per frame (no need to use browser's actual framerate)		
		const jua = jumpAmount * Math.floor(1+ scale);	// jua is the size of sample data used per frame
				
		let oldY2 = 0;
		let newY2 = 0;
		let newX = 0;
		let oldX = 0;	// was called "oldZ" in original impl (probably to reflect its use in 3-byte pixel logic)
			
		// offset to the position of the 1st sample
		// note: the below logic expects that "jua" samples can be read starting at that position
		let offset = (data.length - jua);

		//jac is the search window
		let jac = jumpAmount;
		
		const triggerLevel= this.getTriggerLevel(jua, jac, offset);
		
		const c = scaleIdx <= 4 ? 0 : 2 * jac;	// correction seems to be needed to properly position the displayed range...
		
		let frameTriggerOffset = 0;
		
		// syncronization
		if (this._altSync == false) {

      const one = 2.0 / 255;		// adjust original logic to the sample data range used here..
			const triggerLevelM= triggerLevel - one;
			const triggerLevelP= triggerLevel + one;
			
			frameTriggerOffset = jac;
			
			while (this._voiceData[offset + c + frameTriggerOffset] < (triggerLevelP) && frameTriggerOffset < jac * 2) frameTriggerOffset++;
			while (this._voiceData[offset + c + frameTriggerOffset] >= (triggerLevelM) && frameTriggerOffset < jac * 2) frameTriggerOffset++;
      
      if (frameTriggerOffset == jac * 2) frameTriggerOffset = 0;
			
		} else {
			let distances = [];	// array of arrays
			let qx = jac;
			while ((this._voiceData[offset + qx] >= triggerLevel) && (qx < jac * 2)) qx++;
			let ctr;
			while (qx < jac * 2) {
				ctr = qx;
				let isUp = false;
				//find point where crosses midline
				if (this._voiceData[offset+qx] < triggerLevel) {
					while ((this._voiceData[offset + qx] < triggerLevel) && (qx < jac * 2)) qx++;
					isUp = true;
				} else {
					while ((this._voiceData[offset + qx] >= triggerLevel) && (qx < jac * 2)) qx++;
				}
				// if (qx === 800) break; // JCH: Enable this for debugging if it starts freezing

				//add point to data
				if (!isUp) {
					var data = [qx - ctr, qx];	// difference, position of the offset
					distances.push(data);
				}
			}
			
			ctr = 0; //count of highest values
			let highest = [0, 0]; //this will be the highest value
			
			let data;
			for (data of distances) {
				if (data[0] > highest[0]) {
					highest= [data[0], data[1]];
					ctr = 1;
				} else if (data[0] == highest[0]) {
					highest.push(data[1]);
					ctr++;
				}
			}
			//at this point "highest" should be a list where the first value is the difference, and the rest are points in order where the difference occurred
			//ctr is the number of same values. if more than 95% it's probably a square wave
			if (ctr != 1) ctr = Math.ceil(ctr / 2.0);
			frameTriggerOffset = highest[ctr];
		}
	
		// draw waveform
		var oldY2;		// previous y coord
		for (var x = 0; (x / (scale / 2)) < this._resX; x++) {
			let vdPos = frameTriggerOffset + c + x - Math.floor(this._resX / center); // note: stabilization causes first "c" samples to be "unusable", i.e. skip them

			if (vdPos < 0) { vdPos = 0; }
			let vdSet = this._voiceData[offset + vdPos];
			
			var y = Math.floor((vdSet + 1) / 2 * this._resY);	// use full available height (calc adjusted to sample range used here)

			if (x == 0) {
				oldY2 = y;
			}
			
			newY2 = y;
			
			if (oldY2 > this._resY) oldY2 = this._resY;
			if (newY2 > this._resY) newY2 = this._resY;
			if (newY2 < 0) newY2 = 0;
			if (oldY2 < 0) oldY2 = 0;

			newX = Math.floor(2 * x / scale);	// called "z" in original code
			
			if (oldY2 > newY2) { //waveform moved down
				let t = oldY2;
				oldY2 = newY2;
				newY2 = t;
			}
						
			if (typeof outVertices != 'undefined') {
				// store coordinate in array for use in THREE.js BufferGeometry
				outVertices[3*x]= newX;				// x
				outVertices[3*x+1]= this._resY-newY2;	// y
				// z values are unchanged.. presumably 0
				
			} else {
				// draw line
				if (x == 0) {
					outCtx.moveTo(newX, this._resY-newY2);
				} else {
					outCtx.lineTo(newX, this._resY-newY2);
				}			
			}
			oldX = newX;
			oldY2 = y;
		}
	}  
}

