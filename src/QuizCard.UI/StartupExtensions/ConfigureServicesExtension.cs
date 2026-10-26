using Microsoft.AspNetCore.Authentication.Facebook;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using QuizCard.Entities;
using QuizCard.Entities.IdentifyEntities;
using QuizCard.Repositories;
using QuizCard.RepositoryContracts;
using QuizCard.ServiceContracts;
using QuizCard.Services;
using QuizCard.Services.Services;

namespace QuizCard.UI.StartupExtensions;

public static class ConfigureServicesExtension
{
    public static IServiceCollection ConfigureService(this IServiceCollection services, IConfiguration configuration)
    {
        // 1. Đăng ký ASP.NET Core Identity với ApplicationUser, ApplicationRole và ApplicationDbContext
        services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = false;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequiredLength = 6;
            // Cho phép dùng chung Email giữa các Provider OAuth khác nhau (Google, Facebook)
            options.User.RequireUniqueEmail = false;
        })
        .AddEntityFrameworkStores<ApplicationDbContext>()
        .AddDefaultTokenProviders()
        .AddUserStore<UserStore<ApplicationUser, ApplicationRole, ApplicationDbContext, Guid>>()
        .AddRoleStore<RoleStore<ApplicationRole, ApplicationDbContext, Guid>>();

        // 2. Cấu hình External Authentication (Google & Facebook) từ cấu hình AppSettings / UserSecrets
        var googleClientId = configuration["GoogleKeys:ClientId"] ?? configuration["Authentication:Google:ClientId"];
        var googleClientSecret = configuration["GoogleKeys:ClientSecret"] ?? configuration["Authentication:Google:ClientSecret"];
        var fbAppId = configuration["FacebookKeys:AppId"] ?? configuration["Authentication:Facebook:AppId"];
        var fbAppSecret = configuration["FacebookKeys:AppSecret"] ?? configuration["Authentication:Facebook:AppSecret"];

        var authBuilder = services.AddAuthentication();

        if (!string.IsNullOrEmpty(googleClientId) && !string.IsNullOrEmpty(googleClientSecret))
        {
            authBuilder.AddGoogle(options =>
            {
                options.ClientId = googleClientId;
                options.ClientSecret = googleClientSecret;
                options.SignInScheme = IdentityConstants.ExternalScheme;
            });
        }

        if (!string.IsNullOrEmpty(fbAppId) && !string.IsNullOrEmpty(fbAppSecret))
        {
            authBuilder.AddFacebook(options =>
            {
                options.AppId = fbAppId;
                options.AppSecret = fbAppSecret;
                options.SignInScheme = IdentityConstants.ExternalScheme;
            });
        }

        services.AddAuthorization(options =>
        {
            // Chính sách mặc định yêu cầu xác thực
            options.FallbackPolicy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build();

            // Chính sách cho phép truy cập khi chưa đăng nhập


            options.AddPolicy("AuthorizedForUser", policy => {

                policy.RequireAssertion(context =>
                {
                    if (context.User.Identity?.IsAuthenticated != true)
                    {
                        return false;
                    }

                    return true;

                    //return !context.User.Identity.IsAuthenticated;
                });
            });

            options.AddPolicy("AuthorizedForAdmin", policy => {

                policy.RequireAssertion(context =>
                {
                    var httpContext = context.Resource as HttpContext;
                    if (httpContext?.Request.Cookies.ContainsKey("AdminScheme") == true)
                    {
                        return false; // Nếu không lấy được HttpContext, từ chối truy cập
                    }

                    return true;
                });
            });

            options.AddPolicy("AllowAccessWithoutAuthorized", policy =>
            {
                policy.RequireAssertion(context =>
                {
                    return true;
                });
            });
        });

        // 3. Đăng ký tầng Repositories (Data Access Layer - Clean Architecture)
        services.AddScoped<IUsersRepository, UsersRepository>();
        services.AddScoped<ICardsRespository, CardsRespository>();
        services.AddScoped<IDecksRespository, DecksRespository>();
        services.AddScoped<ICategoriesRespository, CategoriesRespository>();
        services.AddScoped<IStudyProgressesRespository, StudyProgressesRespository>();
        services.AddScoped<IAttendanceRepository, AttendanceRepository>();

        // 4. Đăng ký các tầng nghiệp vụ (Business Services) theo vòng đời Scoped:
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IDeckService, DeckService>();
        services.AddScoped<ICardService, CardService>();
        services.AddScoped<IStudyService, StudyService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IAttendanceService, AttendanceService>();
        services.AddSingleton<ITtsService, TtsService>();

        return services;
    }
}
