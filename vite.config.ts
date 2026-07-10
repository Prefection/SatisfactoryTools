import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			'@src': fileURLToPath(new URL('./src', import.meta.url)),
			'@styles': fileURLToPath(new URL('./styles', import.meta.url)),
			'@data': fileURLToPath(new URL('./data', import.meta.url)),
			'@bin': fileURLToPath(new URL('./bin', import.meta.url)),
		},
	},
})
