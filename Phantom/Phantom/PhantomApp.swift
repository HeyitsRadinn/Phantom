//
//  PhantomApp.swift
//  Phantom
//
//  Created by Radin Najafi on 5/2/25.
//

import SwiftUI

@main
struct PhantomApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
