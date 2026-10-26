using Microsoft.AspNetCore.Identity;

namespace QuizCard.Entities.IdentifyEntities;

public class ApplicationUser : IdentityUser<Guid>
{
    public string? FullName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Provider { get; set; } // "google" | "facebook"
    public string? ProviderKey { get; set; }
    public bool TermsAccepted { get; set; }
    public DateTime? TermsAcceptedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
