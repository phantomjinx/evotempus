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

import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fortawesome/fontawesome-free/css/solid.css'
import '@fortawesome/fontawesome-free/css/fontawesome.css'
import '@fortawesome/fontawesome-free/css/v5-font-face.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js' // nav bar will not work without this
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './app/App'

//
// Create a client instance
//
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Since hints and categories rarely change, keep them fresh for a while
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
})

const root = ReactDOM.createRoot(document.getElementById('root') as Element)
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
