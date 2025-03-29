<template>
  <h1>{{ hello }}</h1>
</template>

<script>
export default {
  setup() {
    const hello = ref('Hello!');
    hello = 2;

    return {
      hello,
    };
  },
};
</script>
