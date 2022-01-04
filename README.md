## Welcome to EvoTempus

An index of the evolution of Planet Earth, from its birth 4.5 billion years. Its easy to get confused over dates and names of ages so this attempts to provide context using the time scale of the planetary geological intervals. Ever wondered how the Stone Age (Paleolithic) relates to the Cenozoic? Hopefully this should help.

The circular visual illustrates Earth's geological intervals, as classified by
the <a href="https://stratigraphy.org" target="_blank" rel="noopener noreferrer">International Commission on Stratigraphy</a>. Starting at the top, moving clockwise, it displays the chronological sequence of ages from oldest to youngest. Those intervals nearest the centre are parents of the intervals further out, eg. the PreCambrian encapsulates the Hadean, Archaen and Proterozoic.

### Usage

The application is available at <a href="https://evotempus.io">evotempus.io</a>.

#### Navigation

Zooming and panning are available using the default methods of the display device, eg. pinching on a tablet.

<em>Double-Clicking</em> an interval will expand it, making it the central parent of the other child intervals displayed. Only those intervals with child-intervals can be expanded, eg. the Archaen can be navigated into while the Hadean cannot.

A <em>Double-Click</em> on the central parent will collapse it to its own parent.

A <em>Single-Click</em> on an interval selects it, leading to:
- A timeline visualization of subjects (Events, Geological, Faunal and Floral) being displayed. All the subjects occurred within the limits of the geological interval, although some may begin in prior intervals and/or end in subsequent intervals.
- A pane is displayed providing an explanation of the interval selected. On smaller screens, a buttton is provided instead, which when pressed with display the pane as a slide-in window. The content is a brief summary description of the interval, according to <a href="https://www.wikipedia.org">Wikipedia</a>. The whole Wikipedia article can be accessed using the button at the bottom-right of the pane.

A <em>Single-Click</em> on any subject in the timeline visualization, selects it and displays a description in the same way as clicking an interval.

A <em>Double-Click</em> on any subject in the timeline visualization will attempt to present it in the most accurate geological interval according to the subject's date range. If the subject happens to cross boundaries then this can result in the geological interval being the base &quot;Geological Timescale&quot;.

Click the menu button on the timeline visual to display the labels of the subjects&apos; category. Subjects belonging to these categories can be filtered out of the timeline visual by clicking each of these labels. The subjects can be restored with a second click. This filtering is maintained while clicking on subjects or on geolical intervals.

A Search box is available for finding any intervals, subjects or descriptions by keyword. A slide-in pane will display the search results and a <em>Single-Click</em>  will navigate to the target in the visuals.

### Building & Running

The backend uses a mongo database which, by default would be located at <a href="mongodb://localhost/evotempus">mongodb://localhost/evotempus</a>. However, this can be changed by using the environment variable `MONGODB_URI`.

To build the application, execute the following:
```
# Initialise the app and backend build tooling
$ npm run init

# Build the app production version
$ npm run build

# Run the node server, which serves the frontend and backend
$ npm start
```

### Developing

Both parts of the application can be executed independantly in development mode, using `yarn` and `gulp`.

```
$ cd backend && gulp
# Use gulp import to seed a new mongo database with the data

$ cd app && yarn start
```

To access a development application from multiples clients.
1. Bring up the production environment by executling `./run-prod-local.sh`
1. Start a web server with a virtual host configured to a specific port, eg. 8443
2. Configure a proxy-passthrough to the application running on localhost:3000
2. Use the host IP adddess and port to access the application, eg. 192.168.1.5:8443


### Licence
The project is licensed under the <a href="https://github.com/phantomjinx/evotempus/blob/master/LICENSE">GPLv3</a>.

### Contributing
If you find a bug or would like to add some data points then please do not hesitate to file an issue or post a pull-request.

Thanks!
