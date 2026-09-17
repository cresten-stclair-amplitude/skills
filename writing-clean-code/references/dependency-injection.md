# Dependency Injection

**Receive replaceable service and infrastructure dependencies explicitly.** Constructing a domain value whose constructor establishes an invariant is normal domain work, not hidden infrastructure coupling.

```csharp
// WRONG
public class Song {
    public RuntimeOverrides Runtime { get; } = new();  // hidden coupling
}

// RIGHT — injectable, with convenience default
public class Song {
    public RuntimeOverrides Runtime { get; }
    public Song() : this(new RuntimeOverrides()) { }
    public Song(RuntimeOverrides runtime) {
        Runtime = runtime;
    }
}
```

**The pattern:** Full constructor accepts all dependencies. Optional parameterless constructor calls it with sensible defaults. Tests use full constructor. Production uses either.

**Apply to:** Replaceable collaborators such as services, stores, adapters, engines, and infrastructure dependencies whose construction would hide coupling or prevent isolated verification.

**Do NOT apply to:** Domain value objects (including validating classes), ordinary collections, or factory methods whose purpose is explicit construction. A dependency hidden inside a method still needs the same ownership analysis; being a local variable is not an exemption.

## Redundant Coupling

Don't expose two paths to the same data.

```csharp
// WRONG — Song accessible via two paths, can diverge
public class ViewManager {
    public Song? Song { get; set; }
    public ISongStore? Store { get; set; }
}

// RIGHT — single path
public class ViewManager {
    public ISongStore? Store { get; set; }
    // access Song via Store.Song
}
```

## Constructor Rules

- Constructors assign dependencies and establish object invariants. Validating and normalizing domain input belongs here; do not publish a partially valid instance.
- Keep external I/O and long-running workflows out of constructors. Protect invariant-bearing fields and retained mutable inputs after construction.
- Inject replaceable service dependencies. A convenience default constructor may delegate to the explicit one; constructing validated domain values does not require injection.
- Singleton is global state in disguise; prefer DI. Only use when exactly one instance is a hard requirement.
