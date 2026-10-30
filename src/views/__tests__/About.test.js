import {beforeEach, describe, expect, it, vi} from 'vitest'
import {flushPromises, mount} from '@vue/test-utils'
import About from '../About.vue'

vi.mock('@tauri-apps/api/app', () => ({getVersion: vi.fn()}))

import {getVersion} from '@tauri-apps/api/app'
const getVersionMock = vi.mocked(getVersion)

beforeEach(() => {
  getVersionMock.mockReset()
  getVersionMock.mockResolvedValue('0.1.0')
})

async function mountPage() {
  const wrapper = mount(About)
  await flushPromises()
  return wrapper
}

describe('About.vue', () => {
  it('affiche le lien GitHub et la mention légale', async () => {
    const wrapper = await mountPage()
    const link = wrapper.find('a.github-link')
    expect(link.attributes('href')).toBe('https://github.com/noicoco')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
    expect(wrapper.text()).toContain('not affiliated with or endorsed by Capcom')
  })

  it('affiche la version de l\'application', async () => {
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('Version 0.1.0')
  })

  it('masque la version si elle est indisponible', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    getVersionMock.mockRejectedValue(new Error('unavailable'))
    const wrapper = await mountPage()
    expect(wrapper.find('.version').exists()).toBe(false)
  })
})
