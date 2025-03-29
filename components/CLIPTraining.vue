<script setup lang="ts">

import { ref, onMounted, shallowRef } from 'vue'
import rough from 'roughjs'
import * as geo from './geo.ts'


interface TrainExampleDS {
  tl: geo.WorldPropPoint,
  o: number
}
interface DatasetEmbedding {
  start: geo.WorldPropPoint,
  end: geo.WorldPropPoint,
  type: string,
  o: number,
  prog: number
}

interface Layout {
  datasetPaddingTop: number,
  datasetPaddingLeft: number,
  datasetInnerMargin: number,
  datasetWidth: number,
  datasetHeight: number,
  n_train_examples: number
}

interface SimulationState {
  trainDataset: TrainExampleDS[],
  datasetEmbeddings: DatasetEmbedding[],
  embeddedExamples: DatasetEmbedding[],
}


function createAnimation(layout: Layout): {ani: geo.Animation<SimulationState>, stageSets: geo.AnimationStageSet[]} {
  let stages: geo.AnimationStage<SimulationState>[] = []
  let stageSets: geo.AnimationStageSet[] = []

  let trainDataset = [...Array(layout.n_train_examples).keys()].map((i) => {
    return {
      o: 0.0,
      tl: {
        x: layout.datasetPaddingLeft,
        y: layout.datasetPaddingTop + layout.datasetHeight * i
      }
    }
  })

  let datasetEmbeddings = [
    ...[...Array(layout.n_train_examples).keys()].map((i) => {
      return {
        o: 0.0,
        start: {
          x: layout.datasetPaddingLeft + layout.datasetWidth,
          y: layout.datasetPaddingTop + layout.datasetHeight * i + layout.datasetHeight / 2
        },
        end: {
          x: 0.2 + (Math.random() * 0.6),
          y: layout.datasetInnerMargin + (Math.random() - layout.datasetInnerMargin * 2)
        },
        prog: 0.0,
        type: "image"
      }
    }),
    ...[...Array(layout.n_train_examples).keys()].map((i) => {
      return {
        o: 0.0,
        start: {
          x: layout.datasetPaddingLeft + layout.datasetWidth,
          y: layout.datasetPaddingTop + layout.datasetHeight * i + layout.datasetHeight / 2
        },
        end: {
          x: 0.2 + (Math.random() * 0.6),
          y: layout.datasetInnerMargin + (Math.random() - layout.datasetInnerMargin * 2)
        },
        prog: 0.0,
        type: "caption"
      }
    })
  ]

  let embeddedExamples = [
    ...[...Array(layout.n_train_examples).keys()].map((i) => {
      return {
        o: 0.0,
        start: { x: datasetEmbeddings[i].start.x, y: datasetEmbeddings[i].start.y },
        end: { x: datasetEmbeddings[i].end.x, y: datasetEmbeddings[i].end.y },
        prog: 1.0,
        type: "image"
      }
    }),
    ...[...Array(layout.n_train_examples).keys()].map((i) => {
      return {
        o: 0.0,
        start: { x: datasetEmbeddings[i + layout.n_train_examples].start.x, y: datasetEmbeddings[i + layout.n_train_examples].start.y },
        end: { x: datasetEmbeddings[i + layout.n_train_examples].end.x, y: datasetEmbeddings[i + layout.n_train_examples].end.y },
        prog: 1.0,
        type: "caption"
      }
    })
  ]


  let curr_state = {
    trainDataset: trainDataset,
    datasetEmbeddings: datasetEmbeddings,
    embeddedExamples: embeddedExamples
  }

  let prev_p = 0.0
  let curr_p = 0.0

  stages.push({ state: { ...curr_state }, sp: prev_p, ep: curr_p })
  curr_state = structuredClone(curr_state)

  // StageSet 1: Make Dataset
  let currStageSet = {
    name: "Create Dataset",
    length: 0.2,
    idx: 0.0
  }
  stageSets.push(structuredClone(currStageSet))
  for (const i in [...Array(layout.n_train_examples).keys()]) {
    prev_p = curr_p
    curr_p = Math.min(1.0, curr_p + (currStageSet.length / layout.n_train_examples))

    curr_state.trainDataset[i].o = 1.0
    stages.push({ state: curr_state, sp: prev_p, ep: curr_p })
    curr_state = structuredClone(curr_state)
  }

  // StageSet 2: Embed
  currStageSet = {
    name: "Embed Examples",
    length: 0.2,
    idx: 1,
  }
  stageSets.push(currStageSet)
  for (let i of [...Array(layout.n_train_examples).keys()]) {
    prev_p = curr_p
    curr_p = Math.min(1.0, curr_p + ((currStageSet.length - 0.05) / layout.n_train_examples))

    curr_state.datasetEmbeddings[i].o = 1.0
    curr_state.datasetEmbeddings[i].prog = 1.0
    curr_state.datasetEmbeddings[i + layout.n_train_examples].o = 1.0
    curr_state.datasetEmbeddings[i + layout.n_train_examples].prog = 1.0
    stages.push({ state: curr_state, sp: prev_p, ep: curr_p })
    curr_state = structuredClone(curr_state)
  }

  for (let i of [...Array(layout.n_train_examples).keys()]) {
    prev_p = curr_p
    curr_p = curr_p + 0.05

    curr_state.datasetEmbeddings[i].o = 0.0
    curr_state.datasetEmbeddings[i + layout.n_train_examples].o = 0.0
    curr_state.embeddedExamples[i].o = 1.0
    curr_state.embeddedExamples[i + layout.n_train_examples].o = 1.0
  }
  stages.push({ state: curr_state, sp: prev_p, ep: curr_p })
  curr_state = structuredClone(curr_state)

  prev_p = curr_p
  curr_p += 0.1
  currStageSet.length = curr_p
  stages.push({ state: curr_state, sp: prev_p, ep: curr_p })
  curr_state = structuredClone(curr_state)

  // StageSet 3: Train
  currStageSet = {
    name: "Train",
    length: 0.5,
    idx: 2
  }
  stageSets.push(currStageSet)


  let n_train_steps = 20
  for (const _ of [...Array(n_train_steps).keys()]) {
    prev_p = curr_p
    let trainEnd = curr_p + (currStageSet.length / n_train_steps)
    curr_p = trainEnd

    for (const i of [...Array(layout.n_train_examples).keys()]) {
      let stepVec = { x: 0.0, y: 0.0 }
      let imgVec = curr_state.embeddedExamples[i]
      for (const j of [...Array(layout.n_train_examples).keys()]) {
        let match = i == j
        let captionVec = curr_state.embeddedExamples[j + layout.n_train_examples]
        let pushVec = { x: imgVec.end.x - captionVec.end.x, y: imgVec.end.y - captionVec.end.y }
        let dist = Math.sqrt(Math.pow(pushVec.x, 2) + Math.pow(pushVec.y, 2)) * 100
        let pushStr = match ? (0.01 * Math.pow(dist, 0.75)) : (-0.1 * Math.pow(dist, -0.6))
        stepVec.x -= pushVec.x * pushStr
        stepVec.y -= pushVec.y * pushStr

        captionVec.end.x += pushVec.x * pushStr
        captionVec.end.y += pushVec.y * pushStr
      }

      imgVec.end.x += stepVec.x
      imgVec.end.y += stepVec.y
    }
    stages.push({ state: curr_state, sp: prev_p, ep: curr_p })
    curr_state = structuredClone(curr_state)

  }

  stages.push({ state: { ...stages[stages.length - 1].state }, sp: 1.0, ep: 1.0 })

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
  datasetPaddingTop: 0.1,
  datasetPaddingLeft: 0.01,
  datasetInnerMargin: 0.01,
  datasetWidth: 0.13,
  datasetHeight: 0.1,
  n_train_examples: 5
}

let mousePos: geo.ViewportPoint = {x: 0.0, y: 0.0}

const customCanvas = shallowRef<HTMLCanvasElement | null>(null)
const ctx = shallowRef<CanvasRenderingContext2D | null>(null)
const prog = ref(0.0)
const isPlaying = ref(false)
const aniStartTime = ref<number | null>(null)
let handleDrag = false

const {ani, stageSets} = createAnimation(layout)

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
    mousePos = {x: e.offsetX * viewport.sharpness, y: e.offsetY * viewport.sharpness}
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
  // ctx.value?.fillRect(worldMousePos.x - 25, worldMousePos.y - 25, 50, 50)

  // draw Dataset
  ctx.value!.strokeStyle = `rgba(0, 0, 0, 1.0)`
  ctx.value!.lineWidth = 2
  geo.drawRoundRectTL(
    { x: layout.datasetPaddingLeft, y: layout.datasetPaddingTop },
    layout.datasetWidth,
    layout.datasetHeight * layout.n_train_examples + layout.datasetInnerMargin,
    world,
    ctx.value!
  )

  ctx.value!.fillStyle = `rgba(0, 0, 0, 1.0)`
  ctx.value!.font = '12px myFont'
  const datasetTextPos = geo.toWorldAbsolute({
    x: layout.datasetPaddingLeft + layout.datasetInnerMargin,
    y: layout.datasetPaddingTop - layout.datasetInnerMargin
  }, world)
  ctx.value!.fillText(
    "Dataset",
    datasetTextPos.x,
    datasetTextPos.y
  )

  for (const te of state.trainDataset) {
    drawDatasetExample(te)
  }

  for (const de of state.datasetEmbeddings) {
    const c = de.type == "image" ? "34, 139, 230" : "255, 146, 43"
    ctx.value!.strokeStyle = `rgba(${c}, ${de.o})`
    ctx.value!.fillStyle = `rgba(${c}, ${de.o})`
    let start_p = geo.toWorldAbsolute(de.start, world)
    let end_p = geo.toWorldAbsolute(de.end, world)
    let curr_p = geo.lerpObj(start_p, end_p, de.prog)
    roughCanvas.circle(curr_p.x, curr_p.y, 0.025 * world.w, { stroke: ctx.value!.strokeStyle, roughness: 0.5 })
    roughCanvas.line(start_p.x, start_p.y, curr_p.x, curr_p.y, { stroke: ctx.value!.strokeStyle, roughness: 0.5 })

  }

  for (const [i, de] of state.embeddedExamples.entries()) {
    let start_p = geo.toWorldAbsolute(de.start, world)
    let end_p = geo.toWorldAbsolute(de.end, world)
    let curr_p = geo.lerpObj(start_p, end_p, de.prog)


    let mouseDist = Math.sqrt(Math.pow(worldMousePos.x - curr_p.x, 2) + Math.pow(worldMousePos.y - curr_p.y, 2))
    let d = 0.025 * world.w
    const selected = (mouseDist <= d/2) 

    let c = de.type == "image" ? "34, 139, 230" : "255, 146, 43"
    ctx.value!.strokeStyle = `rgba(${c}, ${de.o})`
    ctx.value!.fillStyle = `rgba(${c}, ${de.o})`

    let strokeWidth = selected ? 2 : 1
    roughCanvas.circle(curr_p.x, curr_p.y, d, { stroke: ctx.value!.strokeStyle, fill: ctx.value!.fillStyle, roughness: 0.5, strokeWidth: strokeWidth})
    if (selected) {
      let matchIdx = de.type == "image" ? i+layout.n_train_examples : i - layout.n_train_examples
      let captionEl = state.embeddedExamples[matchIdx]
      let cap_start_p = geo.toWorldAbsolute(captionEl.start, world)
      let cap_end_p = geo.toWorldAbsolute(captionEl.end, world)
      let cap_curr_p = geo.lerpObj(cap_start_p, cap_end_p, de.prog)

      ctx.value!.strokeStyle = `rgba(47, 158, 68, ${de.o})`
      ctx.value!.setLineDash([5])
      roughCanvas.line(curr_p.x, curr_p.y, cap_curr_p.x, cap_curr_p.y, {stroke: ctx.value!.strokeStyle, roughness: 0.5})
      ctx.value!.setLineDash([])
    }
  }
}

function drawDatasetExample(te: TrainExampleDS) {
  ctx.value!.strokeStyle = `rgba(0, 0, 0, ${te.o})`
  const dsExampleRect = {
    tl: {
      x: te.tl.x + layout.datasetInnerMargin,
      y: te.tl.y + layout.datasetInnerMargin
    },
    w: layout.datasetWidth - layout.datasetInnerMargin * 2,
    h: layout.datasetHeight - layout.datasetInnerMargin,
  }

  geo.drawRoundRectTL(
    dsExampleRect.tl,
    dsExampleRect.w,
    dsExampleRect.h,
    world,
    ctx.value!
  )

  // Img icon
  ctx.value!.strokeStyle = `rgba(34, 139, 230, ${te.o})`

  const iconRect = {
    tl: {
      x: dsExampleRect.tl.x + layout.datasetInnerMargin,
      y: dsExampleRect.tl.y + layout.datasetInnerMargin,
    },
    w: (dsExampleRect.w - layout.datasetInnerMargin * 3) * 0.3,
    h: (dsExampleRect.h - layout.datasetInnerMargin * 2),
  }
  geo.drawRoundRectTL(
    iconRect.tl,
    iconRect.w,
    iconRect.h,
    world,
    ctx.value!
  )

  // Caption Icon
  ctx.value!.strokeStyle = `rgba(255, 146, 43, ${te.o})`
  ctx.value!.fillStyle = `rgba(255, 146, 43, ${te.o})`

  const captionRect = {
    tl: {
      x: iconRect.tl.x + iconRect.w + layout.datasetInnerMargin,
      y: dsExampleRect.tl.y + layout.datasetInnerMargin + (dsExampleRect.h - layout.datasetInnerMargin * 2) * 0.3,
    },
    w: (dsExampleRect.w - layout.datasetInnerMargin * 3) * 0.7,
    h: (dsExampleRect.h - layout.datasetInnerMargin * 2) * 0.4,
  }
  geo.drawRoundRectTL(
    captionRect.tl,
    captionRect.w,
    captionRect.h,
    world,
    ctx.value!
  )

  ctx.value!.font = '8px myFont'
  const captionTextTL = geo.toWorldAbsolute({ x: captionRect.tl.x + 0.0025, y: captionRect.tl.y + captionRect.h - 0.005 }, world)
  ctx.value!.fillText("Caption", captionTextTL.x, captionTextTL.y)
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
        <SegmentSlider :segments="stageSets" :prog="prog" @prog-update="move"/>
      </div>
    </div>
  </div>
</template>
