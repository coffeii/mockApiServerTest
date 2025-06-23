/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
  ],
  // (선택) 다크모드나 커스텀 테마를 쓰고 싶다면 daisyui 옵션 추가
  // daisyui: {themes: ['light','dark']},
}