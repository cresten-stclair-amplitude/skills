# SOLID Principles

## Single Responsibility (SRP)

Each class or module has a coherent responsibility whose rules change together. Name the distinct actors or concerns before splitting it.

```csharp
// WRONG — one class handles every domain
public void Dispatch(Action action) {
    switch (action) {
        case PhraseEdit: ...
        case ChainEdit: ...
        case MixerEdit: ...
    }
}

// RIGHT — handler per domain
public interface IActionHandler {
    bool CanHandle(SongAction action);
    void Handle(Song song, SongAction action);
}
// PhraseActionHandler, ChainActionHandler, etc.
```

**Test:** Identify the concrete change that would force unrelated responsibilities to change together. Needing "and" in a description is a screening cue, not proof.

## Open/Closed (OCP)

Open for extension, closed for modification. Isolate variable policy when adding a variant would require scattered edits or destabilize unrelated behavior. A stable dispatch switch or registry at one boundary can be appropriate; adding a class for every variant is not an automatic requirement.

```csharp
// WRONG — every new export format edits this method
public void Export(Song song, string format) {
    if (format == "midi") { ... }
    else if (format == "wav") { ... }
}

// RIGHT — new format = new class, registered once
public interface ISongExporter {
    string Format { get; }
    void Export(Song song, Stream output);
}
```

**Techniques:** Strategy pattern, handler registration, plugin architectures.

## Liskov Substitution (LSP)

Any implementation of an interface must be usable wherever the interface is expected. Subtypes must honor the base contract — no surprising exceptions, no narrowed preconditions.

```csharp
// WRONG — subtype breaks the base contract
public class ReadOnlySongStore : SongStore {
    public override void Save(Song song)
        => throw new NotSupportedException();  // callers of SongStore now crash
}

// RIGHT — the contract itself is split so no implementor must lie
public interface ISongReader { Song GetSong(); }
public interface ISongWriter { void SaveSong(Song song); }
```

**Test:** Can you swap any implementation without the caller knowing?

## Interface Segregation (ISP)

No client should depend on methods it doesn't use. Split fat interfaces into focused ones.

```csharp
// WRONG — view forced to depend on write methods it never calls
public interface ISongManager {
    Song GetSong();
    void SaveSong(Song song);
    void ExportMidi(Song song);
    void ImportMidi(string path);
}

// RIGHT — read-only consumers get a focused interface
public interface ISongReader { Song GetSong(); }
public interface ISongWriter { void SaveSong(Song song); }
```

## Dependency Inversion (DIP)

High-level modules depend on abstractions, not concretions.

```csharp
// WRONG — depends on concrete Godot Node
public class ViewManager {
    public InputRouter Router { get; set; }
}

// RIGHT — depends on testable abstraction
public class ViewManager {
    public IInputRouter Router { get; set; }
}
```

**When to create an interface:**

- When a consumer needs a substitutable behavior or a boundary around concrete framework/I/O dependencies.
- When the interface captures what that consumer actually needs, rather than mirroring every concrete member.
- Do not require interfaces for ordinary domain values, including classes that validate and preserve their own invariants.
