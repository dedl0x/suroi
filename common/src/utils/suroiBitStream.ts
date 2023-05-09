/*
Copyright (C) 2023 Henry Sanger (https://suroi.io)

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { BitStream, type BitView } from "bit-buffer";
import { type Vector } from "./vector";

export class SuroiBitStream extends BitStream {
    constructor(source: ArrayBuffer | BitView, byteOffset = 0, byteLength = 0) {
        super(source, byteOffset, byteLength);
    }

    static alloc(length: number): SuroiBitStream {
        return new SuroiBitStream(new ArrayBuffer(length));
    }

    writeString(str: string): void { this.writeASCIIString(str); }
    writeStringFixedLength(str: string, len?: number): void { this.writeASCIIString(str, len); }
    readString(): string { return this.readASCIIString(); }

    readStringFixedLength(len?: number): string { return this.readASCIIString(len); }

    writeFloat(value: number, min: number, max: number, bitCount: number): void {
        const range = (1 << bitCount) - 1;
        const x = value < max ? (value > min ? value : min) : max;
        const t = (x - min) / (max - min);
        this.writeBits(t * range + 0.5, bitCount);
    }

    readFloat(min: number, max: number, bitCount: number): number {
        const range = (1 << bitCount) - 1;
        return min + (max - min) * this.readBits(bitCount) / range;
    }

    writeRotation(value: number, bitCount: number): void {
        this.writeFloat(value, -3.2, 3.2, bitCount);
    }

    readRotation(bitCount: number): number {
        return this.readFloat(-3.2, 3.2, bitCount);
    }

    writeVector(vector: Vector, minX: number, minY: number, maxX: number, maxY: number, bitCount: number): void {
        this.writeFloat(vector.x, minX, maxX, bitCount);
        this.writeFloat(vector.y, minY, maxY, bitCount);
    }

    readVector(minX: number, minY: number, maxX: number, maxY: number, bitCount: number): Vector {
        return {
            x: this.readFloat(minX, maxX, bitCount),
            y: this.readFloat(minY, maxY, bitCount)
        };
    }

    writeUnitVector(vector: Vector, bitCount: number): void {
        this.writeVector(vector, -1, -1, 1, 1, bitCount);
    }

    readUnitVector(bitCount: number): Vector {
        return this.readVector(-1, -1, 1, 1, bitCount);
    }

    writeVector32(vector: Vector): void {
        this.writeFloat32(vector.x);
        this.writeFloat32(vector.y);
    }

    readVector32(): Vector {
        return { x: this.readFloat32(), y: this.readFloat32() };
    }

    writeAlignToNextByte(): void {
        const offset = 8 - this.index % 8;
        if (offset < 8) this.writeBits(0, offset);
    }

    readAlignToNextByte(): void {
        const offset = 8 - this.index % 8;
        if (offset < 8) this.readBits(offset);
    }
}
