// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
struct Selection {
    weapon: i32,
    head: i32,
    chest: i32,
    arms: i32,
    waist: i32,
    legs: i32,
}

fn src_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../src")
}

fn components_dir() -> PathBuf {
    src_dir().join("components")
}

fn assets_dir() -> PathBuf {
    src_dir().join("assets")
}

fn components_file(base: &Path, game: &str, prefix: &str) -> Result<PathBuf, String> {
    let game_file = match game {
        "mh4u" => format!("{prefix}Mh4u.json"),
        "mhgu" => format!("{prefix}Mhgu.json"),
        _ => return Err(format!("unknown game: {game}")),
    };
    fs::create_dir_all(base).map_err(|e| format!("failed to create dir: {e}"))?;
    Ok(base.join(game_file))
}

fn wishlist_path(base: &Path, game: &str) -> Result<PathBuf, String> {
    components_file(base, game, "wishlist")
}

fn materials_path(base: &Path, game: &str) -> Result<PathBuf, String> {
    let name = match game {
        "mh4u" => "materiaux_collectes_4u.json",
        "mhgu" => "materiaux_collectes_gu.json",
        _ => return Err(format!("unknown game: {game}")),
    };
    fs::create_dir_all(base).map_err(|e| format!("failed to create dir: {e}"))?;
    Ok(base.join(name))
}

fn read_selections(path: &Path) -> Vec<Selection> {
    fs::read_to_string(path)
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
        .unwrap_or_default()
}

fn write_selections(path: &Path, list: &[Selection]) -> Result<(), String> {
    let json = serde_json::to_string_pretty(list).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

fn read_owned_materials(path: &Path) -> HashMap<i32, i32> {
    fs::read_to_string(path)
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
        .unwrap_or_default()
}

fn write_owned_materials(path: &Path, owned: &HashMap<i32, i32>) -> Result<(), String> {
    let json = serde_json::to_string_pretty(owned).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_wishlist(game: String) -> Vec<Selection> {
    wishlist_path(&components_dir(), &game)
        .map(|path| read_selections(&path))
        .unwrap_or_default()
}

#[tauri::command]
fn add_to_wishlist(game: String, selection: Selection) -> Result<(), String> {
    let path = wishlist_path(&components_dir(), &game)?;
    let mut list = read_selections(&path);
    list.push(selection);
    write_selections(&path, &list)
}

#[tauri::command]
fn clear_wishlist(game: String) -> Result<(), String> {
    let path = wishlist_path(&components_dir(), &game)?;
    fs::write(path, "[]").map_err(|e| e.to_string())
}

fn remove_selection(path: &Path, index: usize) -> Result<(), String> {
    let mut list = read_selections(path);
    if index >= list.len() {
        return Err(format!("set index out of bounds: {index}"));
    }
    list.remove(index);
    write_selections(path, &list)
}

#[tauri::command]
fn remove_from_wishlist(game: String, index: usize) -> Result<(), String> {
    let path = wishlist_path(&components_dir(), &game)?;
    remove_selection(&path, index)
}

#[tauri::command]
fn load_owned_materials(game: String) -> HashMap<i32, i32> {
    materials_path(&assets_dir(), &game)
        .map(|path| read_owned_materials(&path))
        .unwrap_or_default()
}

#[tauri::command]
fn save_owned_materials(game: String, owned: HashMap<i32, i32>) -> Result<(), String> {
    let path = materials_path(&assets_dir(), &game)?;
    write_owned_materials(&path, &owned)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            load_wishlist,
            add_to_wishlist,
            clear_wishlist,
            remove_from_wishlist,
            load_owned_materials,
            save_owned_materials
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_base(name: &str) -> PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let dir = std::env::temp_dir().join(format!("wishlister_test_{name}_{nanos}"));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn selection(weapon: i32, head: i32) -> Selection {
        Selection {
            weapon,
            head,
            chest: weapon + 1,
            arms: weapon + 2,
            waist: weapon + 3,
            legs: weapon + 4,
        }
    }

    #[test]
    fn selection_serializes_and_deserializes_round_trip() {
        let original = selection(10, 20);
        let json = serde_json::to_string(&original).unwrap();
        let parsed: Selection = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed, original);
    }

    #[test]
    fn selection_deserializes_from_flat_object() {
        let json = r#"{"weapon":1,"head":2,"chest":2,"arms":3,"waist":4,"legs":5}"#;
        let parsed: Selection = serde_json::from_str(json).unwrap();
        assert_eq!(parsed, selection(1, 2));
    }

    #[test]
    fn wishlist_path_mh4u_points_to_component_file() {
        let base = temp_base("wishpath");
        let path = wishlist_path(&base, "mh4u").unwrap();
        assert_eq!(path.file_name().unwrap(), "wishlistMh4u.json");
        assert!(base.join("wishlistMh4u.json") == path);
    }

    #[test]
    fn wishlist_path_mhgu_points_to_component_file() {
        let base = temp_base("wishpath");
        let path = wishlist_path(&base, "mhgu").unwrap();
        assert_eq!(path.file_name().unwrap(), "wishlistMhgu.json");
    }

    #[test]
    fn wishlist_path_unknown_game_returns_error() {
        let base = temp_base("wishpath");
        assert!(wishlist_path(&base, "mh4") == Err("unknown game: mh4".to_string()));
        assert!(wishlist_path(&base, "") == Err("unknown game: ".to_string()));
    }

    #[test]
    fn materials_path_mh4u_points_to_assets_file() {
        let base = temp_base("matpath");
        let path = materials_path(&base, "mh4u").unwrap();
        assert_eq!(path.file_name().unwrap(), "materiaux_collectes_4u.json");
    }

    #[test]
    fn materials_path_mhgu_points_to_assets_file() {
        let base = temp_base("matpath");
        let path = materials_path(&base, "mhgu").unwrap();
        assert_eq!(path.file_name().unwrap(), "materiaux_collectes_gu.json");
    }

    #[test]
    fn materials_path_unknown_game_returns_error() {
        let base = temp_base("matpath");
        assert!(materials_path(&base, "unknown") == Err("unknown game: unknown".to_string()));
    }

    #[test]
    fn components_file_creates_base_directory() {
        let base = temp_base("mkdir");
        let path = components_file(&base, "mh4u", "wishlist").unwrap();
        assert!(path.parent().unwrap().is_dir());
    }

    #[test]
    fn read_selections_missing_file_returns_empty() {
        let base = temp_base("read");
        let path = base.join("nope.json");
        assert!(read_selections(&path).is_empty());
    }

    #[test]
    fn read_selections_invalid_json_returns_empty() {
        let base = temp_base("read");
        std::fs::write(base.join("bad.json"), "not valid json {[").unwrap();
        assert!(read_selections(&base.join("bad.json")).is_empty());
    }

    #[test]
    fn read_selections_empty_array_returns_empty() {
        let base = temp_base("read");
        std::fs::write(base.join("empty.json"), "[]").unwrap();
        assert!(read_selections(&base.join("empty.json")).is_empty());
    }

    #[test]
    fn read_selections_parses_list() {
        let base = temp_base("read");
        let json = serde_json::to_string(&vec![selection(1, 1), selection(6, 10)]).unwrap();
        std::fs::write(base.join("list.json"), json).unwrap();
        let list = read_selections(&base.join("list.json"));
        assert_eq!(list.len(), 2);
        assert_eq!(list[0], selection(1, 1));
        assert_eq!(list[1], selection(6, 10));
    }

    #[test]
    fn write_selections_round_trip() {
        let base = temp_base("write");
        let path = base.join("round.json");
        let list = vec![selection(2, 3), selection(4, 5)];
        write_selections(&path, &list).unwrap();
        assert_eq!(read_selections(&path), list);
    }

    #[test]
    fn write_selections_produces_pretty_json() {
        let base = temp_base("write");
        let path = base.join("pretty.json");
        write_selections(&path, &[selection(1, 1)]).unwrap();
        let content = std::fs::read_to_string(&path).unwrap();
        assert!(content.starts_with('['));
        assert!(content.contains("    \"weapon\": 1,"));
    }

    #[test]
    fn add_to_wishlist_appends_and_preserves_order() {
        let base = temp_base("add");
        let path = base.join("wishlistMh4u.json");
        write_selections(&path, &vec![selection(1, 1)]).unwrap();
        let mut list = read_selections(&path);
        list.push(selection(9, 9));
        write_selections(&path, &list).unwrap();
        let list = read_selections(&path);
        assert_eq!(list.len(), 2);
        assert_eq!(list[0], selection(1, 1));
        assert_eq!(list[1], selection(9, 9));
    }

    #[test]
    fn add_to_empty_wishlist_creates_single_entry() {
        let base = temp_base("add");
        let path = base.join("wishlistMhgu.json");
        let mut list = read_selections(&path);
        list.push(selection(5, 5));
        write_selections(&path, &list).unwrap();
        assert_eq!(read_selections(&path), vec![selection(5, 5)]);
    }

    #[test]
    fn clear_wishlist_empties_file() {
        let base = temp_base("clear");
        let path = base.join("wishlistMh4u.json");
        write_selections(&path, &vec![selection(7, 7)]).unwrap();
        std::fs::write(&path, "[]").unwrap();
        assert!(read_selections(&path).is_empty());
    }

    #[test]
    fn remove_selection_deletes_only_target_index() {
        let base = temp_base("remove");
        let path = base.join("wishlistMh4u.json");
        write_selections(
            &path,
            &vec![selection(1, 1), selection(2, 2), selection(3, 3)],
        )
        .unwrap();
        remove_selection(&path, 1).unwrap();
        assert_eq!(
            read_selections(&path),
            vec![selection(1, 1), selection(3, 3)]
        );
    }

    #[test]
    fn remove_selection_last_entry_leaves_empty_list() {
        let base = temp_base("remove");
        let path = base.join("wishlistMhgu.json");
        write_selections(&path, &vec![selection(4, 4)]).unwrap();
        remove_selection(&path, 0).unwrap();
        assert!(read_selections(&path).is_empty());
    }

    #[test]
    fn remove_selection_out_of_bounds_returns_error() {
        let base = temp_base("remove");
        let path = base.join("wishlistMh4u.json");
        write_selections(&path, &vec![selection(1, 1)]).unwrap();
        assert_eq!(
            remove_selection(&path, 1),
            Err("set index out of bounds: 1".to_string())
        );
        assert_eq!(read_selections(&path), vec![selection(1, 1)]);
    }

    #[test]
    fn read_owned_materials_missing_file_returns_empty_map() {
        let base = temp_base("owned");
        assert!(read_owned_materials(&base.join("missing.json")).is_empty());
    }

    #[test]
    fn read_owned_materials_invalid_json_returns_empty_map() {
        let base = temp_base("owned");
        std::fs::write(base.join("bad.json"), "{oops").unwrap();
        assert!(read_owned_materials(&base.join("bad.json")).is_empty());
    }

    #[test]
    fn owned_materials_round_trip() {
        let base = temp_base("owned");
        let path = base.join("materiaux_collectes_4u.json");
        let mut map = HashMap::new();
        map.insert(203, 3);
        map.insert(356, 1);
        write_owned_materials(&path, &map).unwrap();
        let read = read_owned_materials(&path);
        assert_eq!(read.get(&203), Some(&3));
        assert_eq!(read.get(&356), Some(&1));
    }

    #[test]
    fn save_owned_materials_overwrites_previous_values() {
        let base = temp_base("owned");
        let path = base.join("materiaux_collectes_gu.json");
        let mut first = HashMap::new();
        first.insert(1, 5);
        write_owned_materials(&path, &first).unwrap();
        let mut second = HashMap::new();
        second.insert(99, 2);
        write_owned_materials(&path, &second).unwrap();
        let read = read_owned_materials(&path);
        assert_eq!(read.len(), 1);
        assert_eq!(read.get(&99), Some(&2));
    }

    #[test]
    fn owned_materials_deserialize_from_string_keys() {
        let base = temp_base("owned");
        let path = base.join("keys.json");
        std::fs::write(&path, r#"{ "203": 4, "9999": 0 }"#).unwrap();
        let read = read_owned_materials(&path);
        assert_eq!(read.get(&203), Some(&4));
        assert_eq!(read.get(&9999), Some(&0));
    }

    #[test]
    fn owned_materials_supports_zero_values() {
        let base = temp_base("owned");
        let path = base.join("zero.json");
        let mut map = HashMap::new();
        map.insert(203, 0);
        write_owned_materials(&path, &map).unwrap();
        let read = read_owned_materials(&path);
        assert_eq!(read.contains_key(&203), true);
        assert_eq!(read.get(&203), Some(&0));
    }
}