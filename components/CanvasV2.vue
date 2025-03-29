<script setup lang="ts">

import { ref, onMounted, shallowRef } from 'vue'

interface simState {
  x: number,
  y: number
}

const customCanvas = shallowRef<HTMLCanvasElement | null>(null)
const ctx = shallowRef<CanvasRenderingContext2D | null>(null)
const progSlider = ref<HTMLInputElement | null>(null)
const prog = ref(0.0)
const isPlaying = ref(false)
const aniStartTime = ref(null)

const ani = {
  totalDuration: 3.0,
  stages: [
    { x: 0.0, y: 0.0, sp: -0.0, ep: -0.0 },
    { x: 0.0, y: 0.5, sp: 0.0, ep: 0.3 },
    { x: 0.5, y: 0.5, sp: 0.3, ep: 0.9 },
    { x: 1.0, y: 1.0, sp: 0.9, ep: 1.0 },
    { x: 1.0, y: 1.0, sp: 1.0, ep: 1.0 },
  ]
}



onMounted(() => {
  ctx.value = customCanvas.value!.getContext('2d')
  draw(sim(prog.value))
})

function sim(p: number): simState {
  let w = customCanvas.value!.width
  let h = customCanvas.value!.height
  console.log(w, h, p)
  const min_x = 0.0;
  const min_y = 0.0;
  const max_x = w;
  const max_y = h;

  let prev_ani_stages = ani.stages.filter((s) => s.ep <= p)
  let next_ani_stages = ani.stages.filter((s) => s.ep >= p)
  console.log(prev_ani_stages)
  console.log(next_ani_stages)
  let curr_stage = next_ani_stages[0]
  let prev_stage = prev_ani_stages[prev_ani_stages.length - 1]

  console.log(curr_stage)
  console.log(prev_stage)
  let stage_p = (curr_stage.ep - curr_stage.sp) > 0 ? (p - curr_stage.sp) / (curr_stage.ep - curr_stage.sp) : curr_stage.ep
  console.log(stage_p)
  let xp = (1 - stage_p) * prev_stage.x + stage_p * curr_stage.x
  let yp = (1 - stage_p) * prev_stage.y + stage_p * curr_stage.y


  return {
    x: (1 - xp) * min_x + xp * max_x,
    y: (1 - yp) * min_y + yp * max_y,
  }
}

function draw(state: simState) {
  let w = customCanvas.value!.width
  let h = customCanvas.value!.height
  ctx.value?.clearRect(0, 0, w, h)

  ctx.value?.fillRect(state.x - 75, state.y - 32.5, 150, 75)
}

function move() {
  prog.value = progSlider.value!.value
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

function inc(time) {
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

console.log('test')

</script>

<template>
  <div flex="~ col" border="~ main rounded-md">
    <canvas ref="customCanvas" id='test' @click="move" width="auto" height="auto" style="image-rendering: pixelated">
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
