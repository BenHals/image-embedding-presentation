export interface AnimationStage<S> {
    state: S,
    sp: number,
    ep: number
}

export interface AnimationStageSet {
    name: string,
    length: number,
    idx: number
}

export interface Animation<S> {
    totalDuration: number,
    stages: AnimationStage<S>[]
    stageSets: AnimationStageSet[]
}

interface Point {
    x: number,
    y: number
}


export interface WorldPoint extends Point { }
export interface WorldPropPoint extends Point { }
export interface ViewportPoint extends Point { }

export interface WorldRect {
    tl: WorldPoint,
    w: number,
    h: number
}

export interface WorldPropRect {
    tl: WorldPropPoint,
    w: number,
    h: number
}

export interface ViewportRect {
    tl: ViewportPoint,
    w: number,
    h: number
}

export interface World {
    tl: WorldPoint
    w: number,
    h: number,
}

export interface Viewport {
    tl: WorldPoint
    w: number,
    h: number,
    s: number,
    sharpness: number
}

/**
* Converts a world proportional point (in terms of 0 - 1.0)
* to absolute coords
*/
export function toWorldAbsolute(p: WorldPropPoint, w: World): WorldPoint {
    return {
        x: w.tl.x + p.x * w.w,
        y: w.tl.y + p.y * w.h
    }
}

export function worldToViewport(p: WorldPoint, w: World, v: Viewport): ViewportPoint {
    let offset = { x: w.tl.x - v.tl.x, y: w.tl.y - v.tl.y }
    return {
        x: (p.x + offset.x) * viewportScaling(v),
        y: (p.y + offset.y) * viewportScaling(v)
    }
}

export function viewportToWorld(p: ViewportPoint, w: World, v: Viewport): WorldPoint {
    let offset = { x: w.tl.x - v.tl.x, y: w.tl.y - v.tl.y }
    return {
        x: (p.x / viewportScaling(v)) - offset.x,
        y: (p.y / viewportScaling(v)) - offset.y
    }
}

/**
* Gets a scaling constant to handle viewport scale vs sharpness (number of pixels per 'pixel')
*/
export function viewportScaling(v: Viewport): number {
    return v.sharpness / v.s
}

export function drawRoundRectTL(tl: WorldPropPoint, w: number, h: number, world: World, ctx: CanvasRenderingContext2D) {
    const worldTL = toWorldAbsolute({ x: tl.x, y: tl.y }, world)
    ctx.beginPath()
    ctx.roundRect(
        worldTL.x,
        worldTL.y,
        w * world.w,
        h * world.h,
        6
    )

    ctx.stroke()
}

export function lerpObj<T>(oA: T, oB: T, p: number): T {
    let oC: T = {}
    for (const [key, value] of Object.entries(oB)) {
        if (Array.isArray(value)) {
            oC[key] = value.map((el, i) => { return lerpObj(oA[key][i], el, p) })
        }
        else if (typeof value === 'string') {
            oC[key] = oB[key]
        }
        else if (typeof value === 'object') {
            oC[key] = lerpObj(oA[key], oB[key], p)
        } else {
            oC[key] = (1 - p) * oA[key] + p * oB[key]
        }
    }
    return oC
}

export const colors = {
    red: "#e03131",
    green: "#2f9e44",
    blue: "#1971c2",
    orange: "#f08c00",
}

export const colorsRGB = {
    red: "224, 49, 49",
    green: "47, 158, 68",
    blue: "25, 113, 194",
    orange: "240, 140, 0",
}
