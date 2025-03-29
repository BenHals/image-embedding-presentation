<script setup lang="ts">

import { ref, onMounted, shallowRef } from 'vue'
import rough from 'roughjs'
import * as geo from './geo.ts'

interface Layout {
  innerPadding: number
}

interface ColorRGB {
  R: number,
  G: number,
  B: number
}

interface SimulationState {
  imgOpacity: number,
  imgProg: number,
  augOpacity: number,
  augProg: number,
  augA: {
    R: ColorRGB,
    G: ColorRGB,
    B: ColorRGB,
  },
  augB: {
    R: ColorRGB,
    G: ColorRGB,
    B: ColorRGB,
  },
  embedProg: number,
  lossProg: number,
}


function createAnimation(layout: Layout): { ani: geo.Animation<SimulationState>, stageSets: geo.AnimationStageSet[] } {
  let stages: geo.AnimationStage<SimulationState>[] = []
  let stageSets: geo.AnimationStageSet[] = []


  let curr_state = {
    imgOpacity: 0.0,
    imgProg: 0.0,
    augOpacity: 0.0,
    augProg: 0.0,
    augA: {
      R: { R: 0.6 + Math.random() * 0.4, G: 0.6 + Math.random() * 0.4, B: 0.6 + Math.random() * 0.4 },
      G: { R: 0.6 + Math.random() * 0.4, G: 0.6 + Math.random() * 0.4, B: 0.6 + Math.random() * 0.4 },
      B: { R: 0.6 + Math.random() * 0.4, G: 0.6 + Math.random() * 0.4, B: 0.6 + Math.random() * 0.4 },
    },
    augB: {
      R: { R: 0.6 + Math.random() * 0.4, G: 0.6 + Math.random() * 0.4, B: 0.6 + Math.random() * 0.4 },
      G: { R: 0.6 + Math.random() * 0.4, G: 0.6 + Math.random() * 0.4, B: 0.6 + Math.random() * 0.4 },
      B: { R: 0.6 + Math.random() * 0.4, G: 0.6 + Math.random() * 0.4, B: 0.6 + Math.random() * 0.4 },
    },
    embedProg: 0.0,
    lossProg: 0.0
  }

  let prev_p = 0.0
  let curr_p = 0.0

  curr_state = structuredClone(curr_state)
  stages.push({ state: { ...curr_state }, sp: prev_p, ep: curr_p })
  curr_state = structuredClone(curr_state)

  // StageSet 1: Sample Img
  let currStageSet = {
    name: "Sample Img",
    length: 0.2,
    idx: 0.0
  }
  stageSets.push(structuredClone(currStageSet))


  prev_p = curr_p
  curr_p = currStageSet.length
  curr_state.imgOpacity = 1.0
  curr_state.imgProg = 1.0

  stages.push({ state: curr_state, sp: prev_p, ep: curr_p })
  curr_state = structuredClone(curr_state)

  // StageSet 2: Sample Augs
  currStageSet = {
    name: "Sample Augs",
    length: 0.2,
    idx: 1.0
  }
  stageSets.push(structuredClone(currStageSet))

  prev_p = curr_p
  curr_p += currStageSet.length
  curr_state.augOpacity = 1.0
  curr_state.augProg = 1.0

  stages.push({ state: curr_state, sp: prev_p, ep: curr_p })
  curr_state = structuredClone(curr_state)

  // StageSet 3: Embed Augs
  currStageSet = {
    name: "Embed Augs",
    length: 0.4,
    idx: 2.0
  }
  stageSets.push(structuredClone(currStageSet))

  prev_p = curr_p
  curr_p += currStageSet.length
  curr_state.embedProg = 1.0

  stages.push({ state: curr_state, sp: prev_p, ep: curr_p })
  curr_state = structuredClone(curr_state)

  // StageSet 4: Loss
  currStageSet = {
    name: "Calc Loss",
    length: 0.2,
    idx: 3.0
  }
  stageSets.push(structuredClone(currStageSet))

  prev_p = curr_p
  curr_p += currStageSet.length
  curr_state.lossProg = 1.0

  stages.push({ state: curr_state, sp: prev_p, ep: curr_p })
  curr_state = structuredClone(curr_state)

  stages.push({ state: { ...stages[stages.length - 1].state }, sp: 1.0, ep: 1.0 })

  console.log(stages)

  return {
    ani: {
      totalDuration: 3.0,
      stages: stages,
      stageSets: stageSets
    },
    stageSets: stageSets
  }

}

let world: geo.World = {
  tl: { x: 0.0, y: 0.0 },
  w: 0.0,
  h: 0.0,
}

let viewport: geo.Viewport = {
  tl: { x: 0.0, y: 0.0 },
  w: 0.0,
  h: 0.0,
  s: 1.0,
  sharpness: 4.0
}

const layout: Layout = {
  innerPadding: 0.01
}

let mousePos: geo.ViewportPoint = { x: 0.0, y: 0.0 }

const customCanvas = shallowRef<HTMLCanvasElement | null>(null)
const ctx = shallowRef<CanvasRenderingContext2D | null>(null)
const prog = ref(0.0)
const isPlaying = ref(false)
const aniStartTime = ref<number | null>(null)
let handleDrag = false

const { ani, stageSets } = createAnimation(layout)

function handleResize() {
  customCanvas.value!.width = customCanvas.value!.clientWidth * viewport.sharpness
  customCanvas.value!.height = customCanvas.value!.clientHeight * viewport.sharpness
  world.w = customCanvas.value!.width / viewport.sharpness
  world.h = customCanvas.value!.height / viewport.sharpness
  viewport.w = customCanvas.value!.width * viewport.s
  viewport.h = customCanvas.value!.height * viewport.s
}

onMounted(() => {
  handleResize()
  var myFont = new FontFace('myFont', 'url(public/Excalifont-Regular.woff2)');
  myFont.load().then(function (font) {
    document.fonts.add(font);
  });
  ctx.value = customCanvas.value!.getContext('2d')
  customCanvas.value!.onmousedown = () => { handleDrag = true }
  customCanvas.value!.onmouseup = () => { handleDrag = false }
  customCanvas.value!.onmousemove = (e: MouseEvent) => {
    mousePos = { x: e.offsetX * viewport.sharpness, y: e.offsetY * viewport.sharpness }
    console.log(mousePos)
    if (handleDrag) {

      const bb = customCanvas.value!.getBoundingClientRect();
      const propMovementX = (e.movementX / bb.width) * customCanvas.value!.width
      const propMovementY = (e.movementY / bb.height) * customCanvas.value!.height

      viewport.tl.x += -propMovementX * 1 / geo.viewportScaling(viewport);
      viewport.tl.y += -propMovementY * 1 / geo.viewportScaling(viewport);
    }
    draw(sim(prog.value), layout);
  }

  customCanvas.value!.onwheel = (e) => {
    const scaleDelta = e.deltaY * 0.001 * viewport.s
    let scaleChange = (viewport.s + scaleDelta) / viewport.s

    const bb = customCanvas.value!.getBoundingClientRect();
    const x = viewport.tl.x + Math.floor((e.clientX - bb.left) / bb.width * (customCanvas.value!.width * viewport.s / viewport.sharpness));
    const y = viewport.tl.y + Math.floor((e.clientY - bb.top) / bb.height * (customCanvas.value!.height * viewport.s / viewport.sharpness));

    viewport.s *= scaleChange
    viewport.tl.x = x - (x - viewport.tl.x) * (scaleChange)
    viewport.tl.y = y - (y - viewport.tl.y) * (scaleChange)

    draw(sim(prog.value), layout)
  }

  draw(sim(prog.value), layout)
})

function sim(p: number): SimulationState {
  let prev_ani_stages = ani.stages.filter((s) => s.ep <= p)
  let next_ani_stages = ani.stages.filter((s) => s.ep >= p)
  let curr_stage = next_ani_stages[0]
  let prev_stage = prev_ani_stages[prev_ani_stages.length - 1]

  let stage_p = (curr_stage.ep - curr_stage.sp) > 0 ? (p - curr_stage.sp) / (curr_stage.ep - curr_stage.sp) : curr_stage.ep

  let s = geo.lerpObj(prev_stage.state, curr_stage.state, stage_p)
  console.log(s)

  return s
}

function draw(state: SimulationState, layout: Layout) {
  handleResize()
  let roughCanvas = rough.canvas(customCanvas.value!);
  let world_vp = geo.worldToViewport(world.tl, world, viewport)
  ctx.value!.resetTransform()
  ctx.value?.clearRect(0.0, 0.0, viewport.w, viewport.h)
  ctx.value!.setTransform(geo.viewportScaling(viewport), 0, 0, geo.viewportScaling(viewport), world_vp.x, world_vp.y)

  let worldMousePos = geo.viewportToWorld(mousePos, world, viewport)

  // draw Dataset
  ctx.value!.strokeStyle = `rgba(0, 0, 0, 1.0)`
  ctx.value!.lineWidth = 2
  geo.drawRoundRectTL(
    { x: 0.0 + layout.innerPadding, y: 0.8 + layout.innerPadding },
    0.125 - layout.innerPadding * 2,
    0.125 - layout.innerPadding * 2,
    world,
    ctx.value!
  )

  ctx.value!.fillStyle = `rgba(0, 0, 0, 1.0)`
  ctx.value!.font = '12px myFont'
  const datasetTextPos = geo.toWorldAbsolute({
    x: 0.0 + layout.innerPadding,
    y: 0.8 - layout.innerPadding
  }, world)
  ctx.value!.fillText(
    "Dataset",
    datasetTextPos.x,
    datasetTextPos.y
  )

  let baseMultiplier = {
    R: { R: 1.0, G: 1.0, B: 1.0 },
    G: { R: 1.0, G: 1.0, B: 1.0 },
    B: { R: 1.0, G: 1.0, B: 1.0 },
  }
  drawImage(
    {
      tl: { x: 0.0 + layout.innerPadding, y: 0.8 + layout.innerPadding },
      w: 0.05,
      h: 0.1
    },
    1.0,
    baseMultiplier,
    ctx.value!,
    world
  )

  drawImage(
    {
      tl: { x: 0.0 + layout.innerPadding + 0.05, y: 0.8 + layout.innerPadding },
      w: 0.05,
      h: 0.1
    },
    1.0,
    baseMultiplier,
    ctx.value!,
    world
  )

  let sampleRect = {
    tl: { x: 0.0 + layout.innerPadding + 0.05 + 0.1 * state.imgProg, y: 0.8 + layout.innerPadding - 0.4 * state.imgProg },
    w: 0.05 + 0.05 * state.imgProg,
    h: 0.1 + 0.1 * state.imgProg
  }
  drawImage(
    sampleRect,
    1.0,
    baseMultiplier,
    ctx.value!,
    world
  )

  let augARect = {
    tl: {
      x: 0.0 + layout.innerPadding + 0.05 + 0.1 + 0.2 * state.augProg,
      y: 0.8 + layout.innerPadding - 0.4 + 0.2 * state.augProg
    },
    w: 0.05 + 0.05,
    h: 0.1 + 0.1
  }
  drawImage(
    augARect,
    state.augOpacity,
    state.augA,
    ctx.value!,
    world
  )

  let augBRect = {
    tl: {
      x: 0.0 + layout.innerPadding + 0.05 + 0.1 + 0.2 * state.augProg,
      y: 0.8 + layout.innerPadding - 0.4 - 0.2 * state.augProg
    },
    w: 0.05 + 0.05,
    h: 0.1 + 0.1
  }
  drawImage(
    augBRect,
    state.augOpacity,
    state.augB,
    ctx.value!,
    world
  )

  let augALineSWP = { x: sampleRect.tl.x + sampleRect.w, y: sampleRect.tl.y + sampleRect.h / 2 }
  let augALineEWP = { x: augARect.tl.x, y: augARect.tl.y + augARect.h / 2 }
  let augBLineEWP = { x: augBRect.tl.x, y: augBRect.tl.y + augBRect.h / 2 }

  ctx.value!.strokeStyle = `rgba(0, 0, 0, ${state.augOpacity * 2 - 1.0})`
  drawArrow(augALineSWP, augALineEWP, state, world, roughCanvas)
  drawArrow(augALineSWP, augBLineEWP, state, world, roughCanvas)

  const embedAugBSWP = {
    x: 0.0 + layout.innerPadding + 0.05 + 0.1 + 0.2 + augBRect.w,
    y: 0.8 + layout.innerPadding - 0.4 + 0.2 + augBRect.h / 2
  }
  const embedAugBS = geo.toWorldAbsolute(embedAugBSWP, world)

  const embedAugBMWP = {
    x: 0.0 + layout.innerPadding + 0.05 + 0.1 + 0.2 + augBRect.w + 0.1,
    y: 0.8 + layout.innerPadding - 0.4 + 0.2 + augBRect.h / 2
  }
  const embedAugBM = geo.toWorldAbsolute(embedAugBMWP, world)

  const embedAugBEWP = {
    x: 0.0 + layout.innerPadding + 0.05 + 0.1 + 0.2 + augBRect.w * 2 + 0.1 + 0.1,
    y: 0.8 + layout.innerPadding - 0.4 + 0.2 + augBRect.h / 2
  }
  const embedAugBE = geo.toWorldAbsolute(embedAugBEWP, world)

  roughCanvas.line(
    embedAugBS.x,
    embedAugBS.y,
    embedAugBM.x,
    embedAugBM.y,
    {
      stroke: ctx.value!.strokeStyle
    }
  )

  roughCanvas.rectangle(
    embedAugBM.x,
    embedAugBM.y - augBRect.h * world.h / 2,
    augBRect.w * world.w,
    augBRect.h * world.h,
    {
      stroke: `rgba(${geo.colorsRGB.green}, ${state.augOpacity})`,
    }
  )

  ctx.value!.fillStyle = `rgba(${geo.colorsRGB.green}, 1.0)`
  ctx.value!.font = '16px myFont'
  ctx.value!.fillText(
    "Model",
    embedAugBM.x + augBRect.w / 4 * world.w,
    embedAugBM.y
    //embedAugBM.y + (augBRect.h / 2) * world.h
  )

  drawArrow(
    { x: embedAugBMWP.x + augBRect.w, y: embedAugBMWP.y },
    embedAugBEWP,
    state,
    world,
    roughCanvas
  )

  roughCanvas.rectangle(
    embedAugBE.x,
    embedAugBE.y - augBRect.h * world.h / 4,
    augBRect.w * world.w,
    augBRect.h / 2 * world.h,
    {
      stroke: `rgba(${geo.colorsRGB.orange}, ${state.augOpacity})`,
    }
  )
  roughCanvas.line(
    embedAugBE.x + (augBRect.w * world.w) / 3,
    embedAugBE.y - augBRect.h * world.h / 4,
    embedAugBE.x + (augBRect.w * world.w) / 3,
    embedAugBE.y + augBRect.h * world.h / 4,
    {
      stroke: `rgba(${geo.colorsRGB.orange}, ${state.augOpacity})`,
    }
  )
  roughCanvas.line(
    embedAugBE.x + (augBRect.w * world.w) * 2 / 3,
    embedAugBE.y - augBRect.h * world.h / 4,
    embedAugBE.x + (augBRect.w * world.w) * 2 / 3,
    embedAugBE.y + augBRect.h * world.h / 4,
    {
      stroke: `rgba(${geo.colorsRGB.orange}, ${state.augOpacity})`,
    }
  )

  const embedAugASWP = {
    x: 0.0 + layout.innerPadding + 0.05 + 0.1 + 0.2 + augARect.w,
    y: 0.8 + layout.innerPadding - 0.4 - 0.2 + augARect.h / 2
  }
  const embedAugAS = geo.toWorldAbsolute(embedAugASWP, world)

  const embedAugAMWP = {
    x: 0.0 + layout.innerPadding + 0.05 + 0.1 + 0.2 + augARect.w + 0.1,
    y: 0.8 + layout.innerPadding - 0.4 - 0.2 + augARect.h / 2
  }
  const embedAugAM = geo.toWorldAbsolute(embedAugAMWP, world)

  const embedAugAEWP = {
    x: 0.0 + layout.innerPadding + 0.05 + 0.1 + 0.2 + augARect.w * 2 + 0.1 + 0.1,
    y: 0.8 + layout.innerPadding - 0.4 - 0.2 + augARect.h / 2
  }
  const embedAugAE = geo.toWorldAbsolute(embedAugAEWP, world)

  ctx.value!.strokeStyle = `rgba(0.0, 0.0, 0.0, 1.0)`
  roughCanvas.line(
    embedAugAS.x,
    embedAugAS.y,
    embedAugAM.x,
    embedAugAM.y,
    {
      stroke: ctx.value!.strokeStyle
    }
  )

  roughCanvas.rectangle(
    embedAugAM.x,
    embedAugAM.y - augARect.h * world.h / 2,
    augARect.w * world.w,
    augARect.h * world.h,
    {
      stroke: `rgba(${geo.colorsRGB.green}, ${state.augOpacity})`,
    }
  )

  ctx.value!.fillStyle = `rgba(${geo.colorsRGB.green}, 1.0)`
  ctx.value!.font = '16px myFont'
  ctx.value!.fillText(
    "Model",
    embedAugAM.x + augARect.w / 4 * world.w,
    embedAugAM.y
    //embedAugAM.y + (augARect.h / 2) * world.h
  )

  //roughCanvas.line(
  //  embedAugAM.x + augBRect.w * world.w,
  //  embedAugBM.y,
  //  embedAugBE.x,
  //  embedAugBE.y,
  //  {
  //    stroke: ctx.value!.strokeStyle
  //  }
  //)
  drawArrow(
    { x: embedAugAMWP.x + augARect.w, y: embedAugAMWP.y },
    embedAugAEWP,
    state,
    world,
    roughCanvas
  )

  roughCanvas.rectangle(
    embedAugAE.x,
    embedAugAE.y - augARect.h * world.h / 4,
    augARect.w * world.w,
    augARect.h / 2 * world.h,
    {
      stroke: `rgba(${geo.colorsRGB.orange}, ${state.augOpacity})`,
    }
  )
  roughCanvas.line(
    embedAugAE.x + (augARect.w * world.w) / 3,
    embedAugAE.y - augARect.h * world.h / 4,
    embedAugAE.x + (augARect.w * world.w) / 3,
    embedAugAE.y + augARect.h * world.h / 4,
    {
      stroke: `rgba(${geo.colorsRGB.orange}, ${state.augOpacity})`,
    }
  )
  roughCanvas.line(
    embedAugAE.x + (augARect.w * world.w) * 2 / 3,
    embedAugAE.y - augARect.h * world.h / 4,
    embedAugAE.x + (augARect.w * world.w) * 2 / 3,
    embedAugAE.y + augARect.h * world.h / 4,
    {
      stroke: `rgba(${geo.colorsRGB.orange}, ${state.augOpacity})`,
    }
  )

  ctx.value!.strokeStyle = `rgba(${geo.colorsRGB.red}, ${state.augOpacity})`
  drawArrow(
    { x: embedAugAEWP.x + augARect.w / 2, y: embedAugAMWP.y + augARect.h / 4 },
    { x: embedAugAEWP.x + augARect.w / 2, y: embedAugAMWP.y + (augARect.h) * 3 / 4 },
    state,
    world,
    roughCanvas
  )
  drawArrow(
    { x: embedAugBEWP.x + augBRect.w / 2, y: embedAugBMWP.y - augARect.h / 4 },
    { x: embedAugBEWP.x + augBRect.w / 2, y: embedAugBMWP.y - (augARect.h) * 3 / 4 },
    state,
    world,
    roughCanvas
  )

  ctx.value!.fillStyle = `rgba(${geo.colorsRGB.red}, 1.0)`
  ctx.value!.font = '16px myFont'
  ctx.value!.fillText(
    "Loss",
    embedAugAE.x + (augARect.w * world.w) / 4,
    embedAugAE.y + augARect.h * world.h / 4 + (augARect.h * world.h * 3 / 4),
    //embedAugAM.y + (augARect.h / 2) * world.h
  )

  ctx.value!.fillStyle = `white`
  ctx.value!.fillRect(
    embedAugBS.x + 0.7 * world.w * state.embedProg,
    0.0,
    0.7 * world.w,
    1.0 * world.h
  )

  ctx.value!.fillStyle = `white`
  ctx.value!.fillRect(
    embedAugAE.x,
    embedAugAE.y + augARect.h * world.h / 4 + (augARect.h * world.h * 3 / 4 * state.lossProg),
    augARect.w * world.w,
    (augARect.h * world.h * 6 / 4) * (1 - state.lossProg),
  )

}

function drawArrow(aWP: geo.WorldPropPoint, bWP: geo.WorldPropPoint, state: SimulationState, world: geo.World, roughCanvas: RoughCanvas) {
  const a = geo.toWorldAbsolute(aWP, world)
  const b = geo.toWorldAbsolute(bWP, world)
  let lineDir = { x: a.x - b.x, y: a.y - b.y }
  let lineDirMag = Math.sqrt(Math.pow(lineDir.x, 2) + Math.pow(lineDir.y, 2))
  lineDir.x = lineDir.x / lineDirMag
  lineDir.y = lineDir.y / lineDirMag
  lineDir.x *= 25
  lineDir.y *= 25

  roughCanvas.line(
    a.x,
    a.y,
    b.x,
    b.y,
    {
      stroke: ctx.value!.strokeStyle,
      roughness: 0.5,
    }
  )
  roughCanvas.line(
    b.x,
    b.y,
    b.x + lineDir.x + lineDir.y * 0.2,
    b.y + lineDir.y - lineDir.x * 0.2,
    {
      stroke: ctx.value!.strokeStyle,
      roughness: 0.5,
    }
  )
  roughCanvas.line(
    b.x,
    b.y,
    b.x + lineDir.x - lineDir.y * 0.2,
    b.y + lineDir.y + lineDir.x * 0.2,
    {
      stroke: ctx.value!.strokeStyle,
      roughness: 0.5,
    }

  )
}

function updateColor(c: string, multiplier: { R: number, G: number, B: number }) {
  let c_vals = c.split(', ').map((v) => { return parseFloat(v) })
  return `${c_vals[0] * multiplier.R}, ${c_vals[1] * multiplier.G}, ${c_vals[2] * multiplier.B} `
}

function drawImage(rect: geo.WorldPropRect, o: number, colorMultiplier: { R: ColorRGB, G: ColorRGB, B: ColorRGB }, ctx: CanvasRenderingContext2D, world: geo.World) {

  ctx.strokeStyle = `rgba(${updateColor(geo.colorsRGB.blue, colorMultiplier.B)}, ${o})`
  const topLeftWP = { x: rect.tl.x + layout.innerPadding, y: rect.tl.y + layout.innerPadding }
  const boundingRectWP = {
    tl: topLeftWP,
    w: rect.w - layout.innerPadding * 2,
    h: rect.h - layout.innerPadding * 2,
  }
  geo.drawRoundRectTL(
    boundingRectWP.tl,
    boundingRectWP.w,
    boundingRectWP.h,
    world,
    ctx
  )

  const bottomLeftWP = { x: topLeftWP.x + 0.001, y: topLeftWP.y - 0.002 + boundingRectWP.h }
  const bottomLeft = geo.toWorldAbsolute(bottomLeftWP, world)
  const peakA = geo.toWorldAbsolute(
    {
      x: bottomLeftWP.x + boundingRectWP.w * 0.3,
      y: bottomLeftWP.y - boundingRectWP.h * 0.5
    }, world)
  const peakB = geo.toWorldAbsolute(
    {
      x: bottomLeftWP.x + boundingRectWP.w * 0.5,
      y: bottomLeftWP.y - boundingRectWP.h * 0.3
    }, world)
  const peakC = geo.toWorldAbsolute(
    {
      x: bottomLeftWP.x + boundingRectWP.w * 0.6,
      y: bottomLeftWP.y - boundingRectWP.h * 0.45
    }, world)
  const peakD = geo.toWorldAbsolute(
    {
      x: bottomLeftWP.x + boundingRectWP.w * 0.96,
      y: bottomLeftWP.y - boundingRectWP.h * 0.03
    }, world)

  const sun = geo.toWorldAbsolute(
    {
      x: topLeftWP.x + boundingRectWP.w * 0.7,
      y: topLeftWP.y + boundingRectWP.h * 0.2
    }, world)

  ctx.strokeStyle = `rgba(${updateColor(geo.colorsRGB.green, colorMultiplier.G)}, ${o})`
  ctx.beginPath()
  ctx.moveTo(bottomLeft.x, bottomLeft.y)
  ctx.lineTo(peakA.x, peakA.y)
  ctx.lineTo(peakB.x, peakB.y)
  ctx.lineTo(peakC.x, peakC.y)
  ctx.lineTo(peakD.x, peakD.y)
  ctx.stroke()

  ctx.strokeStyle = `rgba(${updateColor(geo.colorsRGB.orange, colorMultiplier.R)}, ${o})`
  ctx.beginPath()
  ctx.arc(sun.x, sun.y, 0.005 * world.h, 0, Math.PI * 2)
  ctx.stroke()
}

function move(v: number) {
  prog.value = v
  prog.value = Math.min(prog.value, 1.0)
  console.log(v)
  draw(sim(prog.value), layout)
}

function start() {
  if (prog.value >= 1.0) prog.value = 0.0
  isPlaying.value = true
  aniStartTime.value = null
  requestAnimationFrame(inc)
}

function end() {
  isPlaying.value = false
}

function inc(time: number) {
  let deltaTime = 0.0
  if (aniStartTime.value === null) {
    aniStartTime.value = time
  } else {
    deltaTime = (time - aniStartTime.value);
    aniStartTime.value = time
  }
  let prodDelta = deltaTime / (ani.totalDuration * 1000)

  if (!isPlaying.value) return
  prog.value += prodDelta
  let hit_end = prog.value >= 1.0
  prog.value = Math.min(prog.value, 1.0)
  draw(sim(prog.value), layout)

  if (hit_end) isPlaying.value = false

  if (isPlaying.value) {
    requestAnimationFrame(inc)
  }

}

</script>

<template>
  <div flex="~ col" border="~ main rounded-md" style="width: 100%; height: 400px;">
    <canvas ref="customCanvas" id='test' style="image-rendering: pixelated; width: 100%; height: 100%;">
    </canvas>
    <div flex="~ row">
      <div style="width: 20%">
        <button v-if="isPlaying" @click="end">Stop</button>
        <button v-else @click="start">Start</button>
      </div>
      <div style="width: 75%">
        <SegmentSlider :segments="stageSets" :prog="prog" @prog-update="move" />
      </div>
    </div>
  </div>
</template>
