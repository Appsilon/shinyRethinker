library(magrittr)
library(rethinker)
library(shinyRethinker)

host <- 'localhost'
port <- '28015'
db <- 'test'

shiny::shinyApp(
  ui = semanticui::semanticPage(
    shiny::tags$div(rethinkDBInput('turtles', host = host, port = 8000, db = db, table = 'turtles')),
    shiny::textOutput("best"),
    DT::dataTableOutput("table"),
    leaflet::leafletOutput("map")
  ),

  server = shiny::shinyServer(function(input, output, session) {

    cn<-openConnection(host, port)

    data <- reactive({
      validate(
        need(!is.null(input$turtles), "Waiting for database.")
      )
      input$turtles %>%
        jsonlite::fromJSON() %>%
        as.data.frame
    })
    output$map <- leaflet::renderLeaflet({
      leaflet::leaflet() %>%
        leaflet::addProviderTiles("CartoDB.Positron")
    })
    observe({
      validate(
        need(nrow(data()) > 0, "Waiting for database.")
      )
      leaflet::leafletProxy("map") %>%
        leaflet::clearMarkers() %>%
        leaflet::addMarkers(data = data())
    })
    output$table <- DT::renderDataTable({
      data() %>%
        DT::datatable()
    })
    observe({
      add <- input$map_click
      if (!is.null(add)) {
        r()$db(db)$table('turtles')$insert(
          list(
            lat = add$lat,
            lng = add$lng
          ),
          conflict="update",
          return_changes=TRUE
        )$run(cn)
      }
    })
  })
)
