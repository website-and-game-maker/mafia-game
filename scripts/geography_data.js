// =============================================================================
// MAFIA GAME - Geography Graph Data
// =============================================================================

window.GEOGRAPHY_DATA = {
  mansion: {
    name: 'Blackwood Estate Graph',
    bedroomHubNode: 'bedroom_wing',
    detectiveSnoopNode: 'library_stacks',
    nodes: [
      { id: 'bedroom_wing', name: 'Bedroom Wing', type: 'private_cluster', tags: ['sleep', 'rooms'] },
      { id: 'porch_veranda', name: 'Veranda Porch', type: 'vantage', tags: ['porch', 'outdoor'] },
      { id: 'foyer', name: 'Foyer', type: 'shared', tags: ['traffic'] },
      { id: 'hallway', name: 'Hallway', type: 'shared', tags: ['traffic'] },
      { id: 'library_stacks', name: 'Library Stacks', type: 'investigation', tags: ['snoop'] },
      { id: 'parlor', name: 'Parlor', type: 'shared', tags: ['social'] },
      { id: 'kitchen', name: 'Kitchen', type: 'shared', tags: ['social'] },
      { id: 'wine_cellar', name: 'Wine Cellar', type: 'isolated', tags: ['high_risk'] },
      { id: 'garden_path', name: 'Garden Path', type: 'transit', tags: ['outdoor'] }
    ],
    edges: [
      { from: 'bedroom_wing', to: 'hallway', distance: 1, sight: 0.5, hearing: 0.7, kind: 'doorway' },
      { from: 'bedroom_wing', to: 'porch_veranda', distance: 1, sight: 0.8, hearing: 0.4, kind: 'balcony' },
      { from: 'hallway', to: 'foyer', distance: 1, sight: 0.7, hearing: 0.8, kind: 'corridor' },
      { from: 'hallway', to: 'library_stacks', distance: 1, sight: 0.6, hearing: 0.6, kind: 'doorway' },
      { from: 'foyer', to: 'parlor', distance: 1, sight: 0.8, hearing: 0.8, kind: 'open_arch' },
      { from: 'foyer', to: 'kitchen', distance: 2, sight: 0.4, hearing: 0.6, kind: 'service_hall' },
      { from: 'kitchen', to: 'wine_cellar', distance: 1, sight: 0.3, hearing: 0.5, kind: 'stairs' },
      { from: 'foyer', to: 'garden_path', distance: 1, sight: 0.8, hearing: 0.5, kind: 'front_doors' },
      { from: 'porch_veranda', to: 'garden_path', distance: 1, sight: 0.9, hearing: 0.5, kind: 'steps' }
    ]
  },
  train: {
    name: 'Midnight Express Graph',
    bedroomHubNode: 'cabin_row',
    detectiveSnoopNode: 'observation_corridor',
    nodes: [
      { id: 'cabin_row', name: 'Cabin Row', type: 'private_cluster', tags: ['sleep', 'rooms'] },
      { id: 'cabin_porch', name: 'Car End Platform', type: 'vantage', tags: ['porch'] },
      { id: 'observation_corridor', name: 'Observation Corridor', type: 'investigation', tags: ['snoop'] },
      { id: 'dining_car', name: 'Dining Car', type: 'shared', tags: ['social'] },
      { id: 'smoking_lounge', name: 'Smoking Lounge', type: 'shared', tags: ['social'] },
      { id: 'baggage_hold', name: 'Baggage Hold', type: 'isolated', tags: ['high_risk'] },
      { id: 'engine_walkway', name: 'Engine Walkway', type: 'transit', tags: ['high_risk'] },
      { id: 'service_car', name: 'Service Car', type: 'transit', tags: ['utility'] }
    ],
    edges: [
      { from: 'cabin_row', to: 'observation_corridor', distance: 1, sight: 0.6, hearing: 0.8, kind: 'sliding_doors' },
      { from: 'cabin_row', to: 'cabin_porch', distance: 1, sight: 0.8, hearing: 0.4, kind: 'platform_door' },
      { from: 'observation_corridor', to: 'dining_car', distance: 1, sight: 0.8, hearing: 0.7, kind: 'car_link' },
      { from: 'dining_car', to: 'smoking_lounge', distance: 1, sight: 0.9, hearing: 0.8, kind: 'open_car' },
      { from: 'smoking_lounge', to: 'service_car', distance: 1, sight: 0.6, hearing: 0.6, kind: 'car_link' },
      { from: 'service_car', to: 'baggage_hold', distance: 1, sight: 0.4, hearing: 0.6, kind: 'narrow_passage' },
      { from: 'service_car', to: 'engine_walkway', distance: 2, sight: 0.5, hearing: 0.4, kind: 'maintenance_access' }
    ]
  },
  island: {
    name: 'Coral Bay Graph',
    bedroomHubNode: 'bungalow_row',
    detectiveSnoopNode: 'dorm_overlook',
    nodes: [
      { id: 'bungalow_row', name: 'Bungalow Row', type: 'private_cluster', tags: ['sleep', 'rooms'] },
      { id: 'bungalow_porch', name: 'Porches Over Beach', type: 'vantage', tags: ['porch', 'beach'] },
      { id: 'dorm_overlook', name: 'Dorm Overlook', type: 'investigation', tags: ['snoop'] },
      { id: 'main_lodge', name: 'Main Lodge', type: 'shared', tags: ['social'] },
      { id: 'beach_path', name: 'Beach Path', type: 'shared', tags: ['outdoor'] },
      { id: 'jungle_edge', name: 'Jungle Edge', type: 'isolated', tags: ['high_risk'] },
      { id: 'boat_dock', name: 'Boat Dock', type: 'transit', tags: ['outdoor'] },
      { id: 'lighthouse', name: 'Lighthouse', type: 'isolated', tags: ['high_risk'] },
      { id: 'clinic', name: 'Clinic', type: 'utility', tags: ['medical'] }
    ],
    edges: [
      { from: 'bungalow_row', to: 'bungalow_porch', distance: 1, sight: 0.9, hearing: 0.5, kind: 'patio_steps' },
      { from: 'bungalow_row', to: 'dorm_overlook', distance: 1, sight: 0.7, hearing: 0.6, kind: 'inner_path' },
      { from: 'dorm_overlook', to: 'main_lodge', distance: 1, sight: 0.7, hearing: 0.7, kind: 'stone_walk' },
      { from: 'main_lodge', to: 'beach_path', distance: 1, sight: 0.8, hearing: 0.6, kind: 'open_steps' },
      { from: 'beach_path', to: 'jungle_edge', distance: 1, sight: 0.5, hearing: 0.5, kind: 'sand_to_brush' },
      { from: 'beach_path', to: 'boat_dock', distance: 1, sight: 0.9, hearing: 0.4, kind: 'shoreline' },
      { from: 'main_lodge', to: 'clinic', distance: 1, sight: 0.5, hearing: 0.7, kind: 'service_hall' },
      { from: 'jungle_edge', to: 'lighthouse', distance: 2, sight: 0.4, hearing: 0.3, kind: 'ridge_trail' },
      { from: 'bungalow_porch', to: 'beach_path', distance: 1, sight: 0.9, hearing: 0.5, kind: 'overlook' }
    ]
  },
  space: {
    name: 'Prometheus Station Graph',
    bedroomHubNode: 'sleep_pod_deck',
    detectiveSnoopNode: 'surveillance_bay',
    nodes: [
      { id: 'sleep_pod_deck', name: 'Sleep Pod Deck', type: 'private_cluster', tags: ['sleep', 'rooms'] },
      { id: 'pod_lookout', name: 'Pod Lookout', type: 'vantage', tags: ['porch'] },
      { id: 'surveillance_bay', name: 'Surveillance Bay', type: 'investigation', tags: ['snoop'] },
      { id: 'central_hub', name: 'Central Hub', type: 'shared', tags: ['traffic'] },
      { id: 'medbay', name: 'Medbay', type: 'utility', tags: ['medical'] },
      { id: 'reactor_tunnel', name: 'Reactor Tunnel', type: 'isolated', tags: ['high_risk'] },
      { id: 'cargo_hold', name: 'Cargo Hold', type: 'isolated', tags: ['high_risk'] },
      { id: 'observation_ring', name: 'Observation Ring', type: 'shared', tags: ['social'] },
      { id: 'airlock', name: 'Airlock', type: 'transit', tags: ['utility'] }
    ],
    edges: [
      { from: 'sleep_pod_deck', to: 'pod_lookout', distance: 1, sight: 0.8, hearing: 0.4, kind: 'catwalk' },
      { from: 'sleep_pod_deck', to: 'central_hub', distance: 1, sight: 0.6, hearing: 0.8, kind: 'bulkhead' },
      { from: 'central_hub', to: 'surveillance_bay', distance: 1, sight: 0.7, hearing: 0.7, kind: 'hatchway' },
      { from: 'central_hub', to: 'medbay', distance: 1, sight: 0.6, hearing: 0.8, kind: 'hatchway' },
      { from: 'central_hub', to: 'observation_ring', distance: 1, sight: 0.9, hearing: 0.5, kind: 'ring_passage' },
      { from: 'observation_ring', to: 'airlock', distance: 1, sight: 0.7, hearing: 0.5, kind: 'lock_corridor' },
      { from: 'central_hub', to: 'cargo_hold', distance: 2, sight: 0.4, hearing: 0.6, kind: 'freight_lift' },
      { from: 'cargo_hold', to: 'reactor_tunnel', distance: 1, sight: 0.3, hearing: 0.5, kind: 'maintenance_trunk' },
      { from: 'surveillance_bay', to: 'reactor_tunnel', distance: 2, sight: 0.4, hearing: 0.4, kind: 'service_route' }
    ]
  }
};
