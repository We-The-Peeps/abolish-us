import type { Preview } from '@storybook/react-vite'
import '../src/styles.css'

const STORYBOOK_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='675' viewBox='0 0 1200 675'%3E%3Crect width='1200' height='675' fill='%23111111'/%3E%3Crect x='24' y='24' width='1152' height='627' rx='24' fill='%23222222' stroke='%23333333'/%3E%3Ctext x='50%25' y='50%25' fill='%23999999' font-size='42' font-family='Arial, sans-serif' text-anchor='middle' dominant-baseline='middle'%3EStory Placeholder%3C/text%3E%3C/svg%3E"

let placeholderObserverStarted = false

const applyStorybookImagePlaceholders = () => {
  const images = document.querySelectorAll<HTMLImageElement>('img')
  for (const image of images) {
    if (image.dataset.storybookPlaceholderApplied === 'true') {
      continue
    }
    image.dataset.storybookPlaceholderApplied = 'true'
    image.src = STORYBOOK_IMAGE_PLACEHOLDER
  }
}

const ensurePlaceholderObserver = () => {
  if (placeholderObserverStarted) {
    return
  }
  const observer = new MutationObserver(() => {
    applyStorybookImagePlaceholders()
  })
  observer.observe(document.body, { childList: true, subtree: true })
  placeholderObserverStarted = true
}

const preview: Preview = {
  decorators: [
    (Story) => {
      if (typeof window !== 'undefined') {
        queueMicrotask(() => {
          applyStorybookImagePlaceholders()
          ensurePlaceholderObserver()
        })
      }
      return Story()
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
