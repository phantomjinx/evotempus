/*
 * Copyright (C) 2026 P. G. Richardson
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { RefObject, useLayoutEffect, useRef, useState } from 'react'
import useResizeObserver from '@react-hook/resize-observer'

interface Size {
  width: number
  height: number
}

export function useElementSize<T extends HTMLElement = HTMLDivElement>(): [RefObject<T | null>, Size] {
  const target = useRef<T>(null!)
  const [size, setSize] = useState<Size>({
    width: 0,
    height: 0,
  })

  const setRoundedSize = ({ width, height }: Size) => {
    setSize({ width: Math.round(width), height: Math.round(height) })
  }

  useLayoutEffect(() => {
    target.current && setRoundedSize(target.current.getBoundingClientRect())
  }, [target])

  useResizeObserver(target, (entry) => {
    const { inlineSize: width, blockSize: height } = entry.contentBoxSize[0]
    setRoundedSize({ width, height })
  })

  return [target, size]
}
