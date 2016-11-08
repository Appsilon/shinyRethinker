# Some useful keyboard shortcuts for package authoring:
#
#   Build and Reload Package:  'Cmd + Shift + B'
#   Check Package:             'Cmd + Shift + E'
#   Test Package:              'Cmd + Shift + T'

.onLoad <- function(libname, pkgname) {
  # Add directory for static resources
  shiny::addResourcePath('shinyRethinker', system.file('www', package='shinyRethinker', mustWork = TRUE))
}

rethinkDBInput <- function(inputId, host = 'localhost', port = 28015, db = 'test', table) {
  tagList(
    # The call to singleton ensures JS file is included once in a page.
    shiny::singleton(
      shiny::tags$head(
        shiny::tags$script(src = "shinyRethinker/dist.js")
      )
    ),
    shiny::tags$label("Rethinkdb",
                      class = "rethinkdb",
                      style = "visibility: hidden;",
                      id = inputId,
                      `data-host` = host,
                      `data-port` = port,
                      `data-db` = db,
                      `data-table` = table)
  )
}
