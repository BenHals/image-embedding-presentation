<script setup lang="ts">

import { ref, onMounted, shallowRef } from 'vue'
import * as geo from './geo.ts'


interface SimulationState {
  rect_pos: geo.WorldPropPoint
}


function createAnimation(): geo.Animation<SimulationState> {
  let stages: geo.AnimationStage<SimulationState>[] = []
  let curr_state = {
    rect_pos: {x: 0.0, y: 0.0}
  }
  let prev_p = 0.0
  let curr_p = 0.0

  stages.push({ state: { ...curr_state }, sp: prev_p, ep: curr_p })

  while (curr_p < 1.0) {
    prev_p = curr_p
    curr_p = Math.min(1.0, curr_p + Math.random())

    curr_state.rect_pos = { x: Math.random(), y: Math.random() }
    stages.push({ state: { ...curr_state }, sp: prev_p, ep: curr_p })
  }

  stages.push({ state: { ...stages[stages.length - 1].state }, sp: 1.0, ep: 1.0 })

  return {
    totalDuration: 3.0,
    stages: stages
  }

}

let world = {
  tl: {x: 0.0, y: 0.0},
  w: 0.0,
  h: 0.0,
}

let viewport = {
  tl: {x: 0.0, y: 0.0},
  w: 0.0,
  h: 0.0,
  s: 1.0,
  sharpness: 2.0
}

const customCanvas = shallowRef<HTMLCanvasElement | null>(null)
const ctx = shallowRef<CanvasRenderingContext2D | null>(null)
const progSlider = ref<HTMLInputElement | null>(null)
const prog = ref(0.0)
const isPlaying = ref(false)
const aniStartTime = ref<number | null>(null)
let handleDrag = false

const ani = createAnimation()
console.log(ani)

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
  ctx.value = customCanvas.value!.getContext('2d')
  customCanvas.value!.onmousedown = () => {handleDrag = true}
  customCanvas.value!.onmouseup = () => {handleDrag = false}
  customCanvas.value!.onmousemove = (e: MouseEvent) => {
    if (!handleDrag) return;
    viewport.tl.x += -e.movementX * 1/geo.viewportScaling(viewport);
    viewport.tl.y += -e.movementY * 1/geo.viewportScaling(viewport);
    draw(sim(prog.value));
  }

  customCanvas.value!.onwheel = (e) => {viewport.s += e.deltaY * 0.001; draw(sim(prog.value))}
  draw(sim(prog.value))
})

function sim(p: number): SimulationState {
  let prev_ani_stages = ani.stages.filter((s) => s.ep <= p)
  let next_ani_stages = ani.stages.filter((s) => s.ep >= p)
  let curr_stage = next_ani_stages[0]
  let prev_stage = prev_ani_stages[prev_ani_stages.length - 1]

  let stage_p = (curr_stage.ep - curr_stage.sp) > 0 ? (p - curr_stage.sp) / (curr_stage.ep - curr_stage.sp) : curr_stage.ep

  let rect_world_prop_pos = {
    x: (1 - stage_p) * prev_stage.state.rect_pos.x + stage_p * curr_stage.state.rect_pos.x,
    y: (1 - stage_p) * prev_stage.state.rect_pos.y + stage_p * curr_stage.state.rect_pos.y,
  }
  
  return {
    rect_pos: rect_world_prop_pos
  }
}

function draw(state: SimulationState) {
  let world_vp = geo.worldToViewport(world.tl, world, viewport)
  ctx.value!.resetTransform()
  ctx.value?.clearRect(0.0, 0.0, viewport.w, viewport.h)
  ctx.value!.setTransform(geo.viewportScaling(viewport), 0, 0, geo.viewportScaling(viewport), world_vp.x, world_vp.y)

  let rect_wp = geo.toWorldAbsolute(state.rect_pos, world)
  ctx.value?.fillRect(rect_wp.x, rect_wp.y, 0.1*world.w, 0.1*world.w)

  ctx.value!.strokeRect(world.tl.x, world.tl.y, world.w, world.h)
}

function move() {
  prog.value = parseFloat(progSlider.value!.value)
  prog.value = Math.min(prog.value, 1.0)
  draw(sim(prog.value))

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
  draw(sim(prog.value))

  if (hit_end) isPlaying.value = false

  if (isPlaying.value) {
    requestAnimationFrame(inc)
  }

}

</script>

<template>
  <div flex="~ col" border="~ main rounded-md" style="width: 100%; height: 400px;">
    <canvas ref="customCanvas" id='test' @click="move" style="image-rendering: pixelated; width: 100%; height: 100%;">
    </canvas>
    <div flex="~ row">
      <div style="width: 20%">
        <button v-if="isPlaying" @click="end">Stop</button>
        <button v-else @click="start">Start</button>
      </div>
      <div style="width: 75%">
        <input type="range" min=0.0 max=1.0 step=0.01 :value="prog" ref="progSlider" @input="move"
          style="width: 100%"></input>
      </div>
    </div>
  </div>
</template>
