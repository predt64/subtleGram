<template>
  <div class="flex flex-col justify-center items-center bg-gray-100 min-h-screen">
    <h1 class="mb-8 font-bold text-gray-800 text-4xl">
      Добро пожаловать!
    </h1>

    <NuxtLink
      to="/second"
      class="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg text-white transition-colors"
    >
      Перейти на вторую страницу
    </NuxtLink>
  </div>
</template>
