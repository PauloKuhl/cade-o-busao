import React from 'react'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import * as bus from 'bus-promise'

import { Loader } from './'
import { store } from '../store'
import {
  geolocation,
  buildMap,
  buildMarkers
} from '../utils'
import {
  sptransAuth,
  loader,
  updateSearchBox,
  updateGeolocation,
  saveLines
} from '../actions'

const TOKEN = '2d5a4ee1443cb4047633305bf371c72213f6c3aefc9fe3362e42bccb3c01ebf4'

Promise.resolve(TOKEN)
  .then(getGeolocation)
  .then(buildUserMarker)
  .then(authSPTrans)
  .then(getAllLines)
  .then(buildAutocomplete)

const geolocationError = () =>
  alert('Não foi possível obter sua localização! Tente novamente.')

async function getGeolocation () {
  const pos = await geolocation().catch(geolocationError)
  const lat = pos ? pos.coords.latitude : '-23.5498772'
  const lng = pos? pos.coords.longitude : '-46.6361809'

  buildMap(lat, lng)
  store.dispatch(updateGeolocation({ lat, lng }))

  return { lat, lng }
}

async function buildUserMarker ({ lat, lng }) {
  const markers = [{
    lat: Number(lat),
    lng: Number(lng),
    icon: 'user'
  }]
  buildMarkers(markers)
}

async function authSPTrans () {
  const auth = await bus.auth(TOKEN)
  store.dispatch(sptransAuth(auth))

  return { auth }
}

async function getAllLines ({ auth }) {
  const storagedLines = store.getState().storagedState.lines
  if (storagedLines.length) return storagedLines[0]

  const lines = await bus.find({
    auth,
    type: 'lines',
    terms: '*'
  })

  store.dispatch(saveLines(lines))

  return lines
}

function buildAutocomplete (lines) {
  const buildData = item => ({
    text: `${item.route_id} - ${item.trip_headsign}`,
    shapeId: item.shape_id,
    routeId: item.route_id,
    directionId: item.direction_id
  })
  const autocompleteData = lines.map(buildData)
  store.dispatch(updateSearchBox({ autocompleteData }))
  store.dispatch(loader({ visible: false }))
}

const App = ({ children }) => (
  <MuiThemeProvider>
    <main>
      <Loader />
      {children}
    </main>
  </MuiThemeProvider>
)

export default App