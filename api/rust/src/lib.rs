//! Volt Plugin API
//!
//! This crate provides the core API for building Volt launcher plugins.

pub mod api;
pub mod registry;

pub use api::VoltPluginAPI;
pub use registry::PluginRegistry;
