using Microsoft.AspNetCore.Authentication.Facebook;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using QuizCard.Entities;
using QuizCard.Entities.IdentifyEntities;
using QuizCard.Repositories;
using QuizCard.RepositoryContracts;
using QuizCard.ServiceContracts;
using QuizCard.Services;
using QuizCard.Services.Services;
using QuizCard.Infrastructure.ExternalAPICalls.cloudinaryAPIs;
using System.Security.Claims;

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

        // Cấu hình Cookie chuyển hướng về đúng trang Frontend (SPA) thay vì mặc định /Account/Login và /Account/AccessDenied của MVC
        services.ConfigureApplicationCookie(options =>
        {
            // Đường dẫn chuyển hướng về trang Frontend khi người dùng chưa đăng nhập
            options.LoginPath = "/";
            // Đường dẫn chuyển hướng về trang Frontend khi người dùng bị từ chối truy cập
            options.AccessDeniedPath = "/";

            // Xử lý đặc thù cho SPA: Đối với các request gọi API (/api/...), trả về mã trạng thái 401/403 thay vì redirect HTML
            options.Events.OnRedirectToLogin = context =>
            {
                if (context.Request.Path.StartsWithSegments("/api"))
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                }
                context.Response.Redirect(context.RedirectUri);
                return Task.CompletedTask;
            };

            options.Events.OnRedirectToAccessDenied = context =>
            {
                if (context.Request.Path.StartsWithSegments("/api"))
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return Task.CompletedTask;
                }
                context.Response.Redirect(context.RedirectUri);
                return Task.CompletedTask;
            };
        });

        // 2. Cấu hình External Authentication (Google & Facebook) từ cấu hình AppSettings / UserSecrets
        var googleClientId = configuration["GoogleKeys:ClientId"] ?? configuration["Authentication:Google:ClientId"];
        var googleClientSecret = configuration["GoogleKeys:ClientSecret"] ?? configuration["Authentication:Google:ClientSecret"];
        var fbAppId = configuration["FacebookKeys:AppId"] ?? configuration["Authentication:Facebook:AppId"];
        var fbAppSecret = configuration["FacebookKeys:AppSecret"] ?? configuration["Authentication:Facebook:AppSecret"];

        var authBuilder = services.AddAuthentication();

        // 2.1 Cấu hình Cookie Scheme riêng biệt dành cho Quản trị viên (Admin Area)
        authBuilder.AddCookie("AdminScheme", options =>
        {
            options.Cookie.Name = "QuizCard_Admin_Token";
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.ExpireTimeSpan = TimeSpan.FromHours(24);
            options.SlidingExpiration = true;
            options.Events.OnRedirectToLogin = context =>
            {
                if (context.Request.Path.StartsWithSegments("/api"))
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                }
                context.Response.Redirect("/");
                return Task.CompletedTask;
            };
            options.Events.OnRedirectToAccessDenied = context =>
            {
                if (context.Request.Path.StartsWithSegments("/api"))
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return Task.CompletedTask;
                }
                context.Response.Redirect("/");
                return Task.CompletedTask;
            };
        });

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

            options.AddPolicy("AuthorizedForAdmin", policy =>
            {
                policy.AddAuthenticationSchemes("AdminScheme", IdentityConstants.ApplicationScheme);
                policy.RequireAssertion(context =>
                {
                    var user = context.User;
                    if (user?.Identity?.IsAuthenticated == true)
                    {
                        if (user.IsInRole("Admin") || user.HasClaim(ClaimTypes.Role, "Admin") || user.HasClaim("IsAdmin", "true"))
                        {
                            return true;
                        }
                    }
                    return false;
                });
            });
        });

        // 3. Đăng ký tầng Repositories (Data Access Layer - Clean Architecture)
        services.AddScoped<IUsersRepository, UsersRepository>();
        services.AddScoped<ICardsRespository, CardsRespository>();
        services.AddScoped<IDecksRespository, DecksRespository>();
        services.AddScoped<IFoldersRepository, FoldersRepository>();
        services.AddScoped<IStudyProgressesRespository, StudyProgressesRespository>();
        services.AddScoped<IAttendanceRepository, AttendanceRepository>();
        services.AddScoped<ITrashRepository, TrashRepository>();
        services.AddScoped<IRecentsRepository, RecentsRepository>();
        services.AddScoped<ICloudinaryVideosRepository, CloudinaryVideosRepository>();

        // 4. Đăng ký các tầng nghiệp vụ (Business Services) theo vòng đời Scoped:
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IDeckService, DeckService>();
        services.AddScoped<ICardService, CardService>();
        services.AddScoped<IStudyService, StudyService>();
        services.AddScoped<IFolderService, FolderService>();
        services.AddScoped<IAttendanceService, AttendanceService>();
        services.AddScoped<ITrashService, TrashService>();
        services.AddScoped<IRecentsService, RecentsService>();
        services.AddScoped<ICloudinaryVideosService, CloudinaryVideosService>();
        services.AddSingleton<ITtsService, TtsService>();

        // 5. Đăng ký Background Service tự động dọn dẹp Thùng rác sau 5 ngày
        services.AddHostedService<QuizCard.UI.BackgroundServices.TrashCleanupBackgroundService>();

        // 6. Đăng ký Cloudinary Infrastructure (Lưu trữ và phân phối video bài giảng)
        services.Configure<CloudinarySettings>(configuration.GetSection(CloudinarySettings.SectionName));
        services.AddHttpClient<ICloudinaryService, CloudinaryService>(client =>
        {
            client.Timeout = TimeSpan.FromMinutes(30); // Cho phép tải lên video dung lượng lớn
        });

        return services;
    }
}
