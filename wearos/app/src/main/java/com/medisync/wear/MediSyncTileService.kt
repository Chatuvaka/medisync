package com.medisync.wear

import androidx.wear.tiles.RequestBuilders
import androidx.wear.tiles.ResourceBuilders
import androidx.wear.tiles.TileBuilders
import androidx.wear.tiles.TileService
import androidx.wear.tiles.LayoutElementBuilders
import androidx.wear.tiles.ColorBuilders
import androidx.wear.tiles.DimensionBuilders
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture

/**
 * Tile para acceso instantáneo a la próxima toma desde la pantalla principal del reloj
 */
class MediSyncTileService : TileService() {

    override fun onTileRequest(requestParams: RequestBuilders.TileRequest): ListenableFuture<TileBuilders.Tile> {
        val rootLayout = LayoutElementBuilders.Column.Builder()
            .addContent(
                LayoutElementBuilders.Text.Builder()
                    .setText("MediSync")
                    .setFontStyle(LayoutElementBuilders.FontStyle.Builder().setSize(DimensionBuilders.sp(12f)).build())
                    .setFontColor(ColorBuilders.argb(0xFF60A5FA.toInt()))
                    .build()
            )
            .addContent(
                LayoutElementBuilders.Text.Builder()
                    .setText("Próxima Toma")
                    .setFontStyle(LayoutElementBuilders.FontStyle.Builder().setSize(DimensionBuilders.sp(14f)).build())
                    .setFontColor(ColorBuilders.argb(0xFFFFFFFF.toInt()))
                    .build()
            )
            .build()

        val tile = TileBuilders.Tile.Builder()
            .setResourcesVersion("1")
            .setTimeline(
                TileBuilders.Timeline.Builder()
                    .addTimelineEntry(
                        TileBuilders.TimelineEntry.Builder()
                            .setLayout(LayoutElementBuilders.Layout.Builder().setRoot(rootLayout).build())
                            .build()
                    )
                    .build()
            )
            .build()

        return Futures.immediateFuture(tile)
    }

    override fun onTileResourcesRequest(requestParams: RequestBuilders.ResourcesRequest): ListenableFuture<ResourceBuilders.Resources> {
        return Futures.immediateFuture(ResourceBuilders.Resources.Builder().setVersion("1").build())
    }
}

